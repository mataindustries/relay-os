export type KnowledgeApprovalStatus = 'unapproved' | 'approved' | 'rejected';

export interface KnowledgeForVisibility {
  readonly id: string;
  readonly approvalStatus: KnowledgeApprovalStatus;
  readonly sourceReferenceIds: readonly string[];
  readonly approvalDecisionIds: readonly string[];
}

export interface EmployeeVisibleKnowledge extends KnowledgeForVisibility {
  readonly approvalStatus: 'approved';
  readonly employeeVisible: true;
}

export class KnowledgeVisibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KnowledgeVisibilityError';
  }
}

/**
 * Creates employee-visible knowledge only after the approval and provenance
 * boundary has been satisfied. This is intentionally the only domain behavior
 * implemented in Phase 0.
 */
export function exposeToEmployee(knowledge: KnowledgeForVisibility): EmployeeVisibleKnowledge {
  if (knowledge.approvalStatus !== 'approved') {
    throw new KnowledgeVisibilityError('Only owner-approved knowledge can be employee-visible.');
  }

  if (knowledge.sourceReferenceIds.length === 0) {
    throw new KnowledgeVisibilityError(
      'Employee-visible knowledge must retain at least one source reference.',
    );
  }

  if (knowledge.approvalDecisionIds.length === 0) {
    throw new KnowledgeVisibilityError(
      'Employee-visible knowledge must retain its approval history.',
    );
  }

  return Object.freeze({
    ...knowledge,
    approvalStatus: 'approved',
    sourceReferenceIds: Object.freeze([...knowledge.sourceReferenceIds]),
    approvalDecisionIds: Object.freeze([...knowledge.approvalDecisionIds]),
    employeeVisible: true,
  });
}
