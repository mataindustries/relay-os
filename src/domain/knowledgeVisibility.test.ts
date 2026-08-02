import { describe, expect, it } from 'vitest';

import { KnowledgeVisibilityError, exposeToEmployee } from './knowledgeVisibility';

describe('employee-visible knowledge invariant', () => {
  it.each(['unapproved', 'rejected'] as const)(
    'prevents %s knowledge from becoming employee-visible',
    (approvalStatus) => {
      expect(() =>
        exposeToEmployee({
          id: 'proposal-1',
          approvalStatus,
          sourceReferenceIds: ['source-reference-1'],
          approvalDecisionIds: [],
        }),
      ).toThrowError(
        new KnowledgeVisibilityError('Only owner-approved knowledge can be employee-visible.'),
      );
    },
  );

  it('rejects approved knowledge without a source reference', () => {
    expect(() =>
      exposeToEmployee({
        id: 'procedure-1',
        approvalStatus: 'approved',
        sourceReferenceIds: [],
        approvalDecisionIds: ['approval-decision-1'],
      }),
    ).toThrowError(
      new KnowledgeVisibilityError(
        'Employee-visible knowledge must retain at least one source reference.',
      ),
    );
  });

  it('rejects approved knowledge without approval history', () => {
    expect(() =>
      exposeToEmployee({
        id: 'procedure-1',
        approvalStatus: 'approved',
        sourceReferenceIds: ['source-reference-1'],
        approvalDecisionIds: [],
      }),
    ).toThrowError(
      new KnowledgeVisibilityError('Employee-visible knowledge must retain its approval history.'),
    );
  });

  it('exposes approved knowledge only when source and approval history remain attached', () => {
    const sourceReferenceIds = ['source-reference-1'];
    const approvalDecisionIds = ['approval-decision-1'];
    const visibleKnowledge = exposeToEmployee({
      id: 'procedure-1',
      approvalStatus: 'approved',
      sourceReferenceIds,
      approvalDecisionIds,
    });

    sourceReferenceIds.length = 0;
    approvalDecisionIds.length = 0;

    expect(visibleKnowledge).toMatchObject({
      approvalStatus: 'approved',
      employeeVisible: true,
      sourceReferenceIds: ['source-reference-1'],
      approvalDecisionIds: ['approval-decision-1'],
    });
  });
});
