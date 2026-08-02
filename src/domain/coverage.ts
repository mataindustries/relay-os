import type {
  KnowledgeClaim,
  KnowledgeGap,
  PhaseOneSnapshot,
  SourceReference,
  TopicCoverage,
} from './entities';
import { selectEmployeeVisibleKnowledge } from './employeeVisibility';
import { OPERATIONAL_TOPICS } from './operationalTopics';
import { domainSuccess, type DomainResult } from './result';
import { validatePhaseOneSnapshot } from './validation';

const ACTIVE_GAP_STATUSES = new Set(['open', 'question-ready', 'answered', 'proposal-created']);

function sourceBacked(claim: KnowledgeClaim): boolean {
  return claim.sourceReferenceIds.length > 0;
}

function referencesForClaims(
  snapshot: PhaseOneSnapshot,
  claims: readonly KnowledgeClaim[],
): readonly SourceReference[] {
  const sourceIds = new Set(claims.flatMap(({ sourceReferenceIds }) => sourceReferenceIds));
  return snapshot.sourceReferences.filter(({ id }) => sourceIds.has(id));
}

function gapForTopic(snapshot: PhaseOneSnapshot, topicKey: string): KnowledgeGap | undefined {
  const matching = snapshot.knowledgeGaps.filter((gap) => gap.topicKey === topicKey);
  return (
    matching.find(({ status }) => ACTIVE_GAP_STATUSES.has(status)) ??
    [...matching].reverse().find(({ status }) => status === 'dismissed')
  );
}

/**
 * Pure Phase 2 coverage projection. It relies only on explicit topic keys and
 * explicit lifecycle records; source wording is never inspected or compared.
 */
export function evaluateTopicCoverage(
  snapshot: PhaseOneSnapshot,
): DomainResult<readonly TopicCoverage[]> {
  const validation = validatePhaseOneSnapshot(snapshot);
  if (!validation.ok) return validation;

  const eligibleByTopic = new Map(
    selectEmployeeVisibleKnowledge(snapshot).flatMap(({ claim }) =>
      claim.topicKey === undefined ? [] : [[claim.topicKey, claim] as const],
    ),
  );

  const coverage = OPERATIONAL_TOPICS.map((topic): TopicCoverage => {
    const topicClaims = snapshot.knowledgeClaims.filter(({ topicKey }) => topicKey === topic.key);
    const candidateClaims = topicClaims.filter(
      (claim) =>
        sourceBacked(claim) &&
        (claim.lifecycleStatus === 'extracted' || claim.lifecycleStatus === 'proposed'),
    );
    const conflictingClaims = topicClaims.filter(
      ({ lifecycleStatus }) => lifecycleStatus === 'conflicting-information',
    );
    const approvedClaim = eligibleByTopic.get(topic.key);
    const gap = gapForTopic(snapshot, topic.key);
    const state =
      approvedClaim !== undefined
        ? ('approved' as const)
        : conflictingClaims.length > 0
          ? ('conflicting' as const)
          : candidateClaims.length > 0
            ? ('candidate' as const)
            : gap?.status === 'dismissed'
              ? ('dismissed' as const)
              : ('missing' as const);
    const supportClaims = [
      ...(approvedClaim === undefined ? [] : [approvedClaim]),
      ...candidateClaims,
      ...conflictingClaims,
    ];
    const base = {
      topic,
      state,
      candidateClaims,
      conflictingClaims,
      supportingSourceReferences: referencesForClaims(snapshot, supportClaims),
    };

    return {
      ...base,
      ...(approvedClaim === undefined ? {} : { approvedClaim }),
      ...(gap === undefined ? {} : { gap }),
    };
  });

  return domainSuccess(coverage);
}
