import type { EmployeeVisibleKnowledge, PhaseOneSnapshot } from './entities';

export function selectEmployeeVisibleKnowledge(
  snapshot: PhaseOneSnapshot,
): readonly EmployeeVisibleKnowledge[] {
  const { company, role } = snapshot;
  if (company === null || role === null || role.status !== 'active') return [];

  return snapshot.knowledgeClaims.flatMap((claim) => {
    if (
      claim.companyId !== company.id ||
      claim.roleId !== role.id ||
      claim.lifecycleStatus !== 'approved'
    ) {
      return [];
    }

    const hasApprovedRevision = snapshot.knowledgeClaims.some(
      (candidate) =>
        candidate.supersedesClaimId === claim.id && candidate.lifecycleStatus === 'approved',
    );
    if (hasApprovedRevision || claim.sourceReferenceIds.length === 0) return [];

    const sourceReferences = claim.sourceReferenceIds.flatMap((sourceId) => {
      const source = snapshot.sourceReferences.find(({ id }) => id === sourceId);
      return source === undefined ? [] : [source];
    });
    if (sourceReferences.length !== claim.sourceReferenceIds.length) return [];

    const approvalDecisions = snapshot.approvalDecisions.filter(
      (decision) =>
        decision.claimId === claim.id &&
        decision.claimVersion === claim.version &&
        decision.decision === 'approve',
    );
    if (approvalDecisions.length === 0) return [];

    return [
      {
        claim: { ...claim, lifecycleStatus: 'approved' },
        sourceReferences,
        approvalDecisions,
      },
    ];
  });
}
