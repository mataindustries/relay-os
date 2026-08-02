import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  PhaseOneService,
  type DomainResult,
  type PhaseOneSnapshot,
} from '../domain';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { App } from './App';

const FIXED_TIME = '2026-08-02T18:00:00.000Z';

function successful<T>(result: DomainResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw result.error;
  return result.value;
}

function phaseThreeSeed(): PhaseOneSnapshot {
  return {
    ...EMPTY_PHASE_ONE_SNAPSHOT,
    company: {
      id: 'journey-company',
      name: 'Fictional Journey Heating',
      industry: 'Fictional home services',
      serviceArea: 'Fictional North Valley',
      contactInformation: {
        phone: 'Fictional contact withheld',
        email: 'owner@example.test',
      },
      operatingTimezone: 'America/Denver',
      status: 'active',
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
    },
    role: {
      id: 'journey-role',
      companyId: 'journey-company',
      title: 'Home-Service Office Manager / Dispatcher',
      mission: 'Coordinate safe, source-backed dispatch handoffs.',
      status: 'active',
      responsibilities: [
        {
          id: 'journey-responsibility',
          roleId: 'journey-role',
          title: 'Coordinate dispatch',
          expectedOutcome: 'Each accepted call has a complete handoff.',
          frequency: 'Every service day',
          completionEvidence: 'Dispatch record',
          status: 'active',
        },
      ],
      authorityBoundaries: [
        {
          id: 'journey-boundary-scheduling',
          roleId: 'journey-role',
          subject: 'Scheduling decisions',
          permissionLevel: 'may-decide',
          limitOrConstraint: 'May make a matching structured scheduling decision.',
          escalationDestination: 'Service owner',
          notes: 'Only the explicit Phase 3 binding authorizes the request.',
          topicKeys: ['scheduling'],
          applicableRequestTypes: ['decision-request'],
        },
        {
          id: 'journey-boundary-refunds',
          roleId: 'journey-role',
          subject: 'Refund actions',
          permissionLevel: 'may-act-within-limit',
          limitOrConstraint: 'May issue a refund only within the structured limit.',
          escalationDestination: 'Service owner',
          notes: 'The free-text wording is not parsed for the amount.',
          topicKeys: ['refunds'],
          applicableRequestTypes: ['financial-action'],
          numericLimit: 100,
          currency: 'USD',
          structuredConstraintType: 'amount-limit',
        },
      ],
      escalationRules: [
        {
          id: 'journey-rule-legacy',
          roleId: 'journey-role',
          trigger: 'Retained Phase 1 owner wording.',
          destination: 'Service owner',
          urgency: 'same-day',
          requiredContext: 'A safe structured request summary.',
          expectedResponse: 'The owner records a decision.',
        },
      ],
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
    },
    sourceReferences: [
      {
        id: 'journey-source-scheduling',
        companyId: 'journey-company',
        roleId: 'journey-role',
        sourceTitle: 'Scheduling policy (fictional)',
        sourceType: 'policy',
        sourceLocator: 'Section 1: approved scheduling',
        excerpt: 'Confirm the customer arrival window before dispatch.',
        recordedAt: FIXED_TIME,
      },
      {
        id: 'journey-source-refunds',
        companyId: 'journey-company',
        roleId: 'journey-role',
        sourceTitle: 'Refund policy (fictional)',
        sourceType: 'policy',
        sourceLocator: 'Section 2: approved refunds',
        excerpt: 'Use the recorded authority boundary for refund decisions.',
        recordedAt: FIXED_TIME,
      },
      {
        id: 'journey-source-owner-only',
        companyId: 'journey-company',
        roleId: 'journey-role',
        sourceTitle: 'Owner-only unapproved note',
        sourceType: 'owner-note',
        sourceLocator: 'Owner workspace only',
        excerpt: 'This unapproved source content must remain employee-hidden.',
        recordedAt: FIXED_TIME,
      },
    ],
    knowledgeClaims: [
      {
        id: 'journey-claim-scheduling',
        companyId: 'journey-company',
        roleId: 'journey-role',
        statement: 'Confirm the customer arrival window before dispatch.',
        category: 'procedure',
        provenance: 'source-extracted',
        lifecycleStatus: 'approved',
        sourceReferenceIds: ['journey-source-scheduling'],
        createdAt: FIXED_TIME,
        updatedAt: FIXED_TIME,
        version: 1,
        topicKey: 'scheduling',
      },
      {
        id: 'journey-claim-refunds',
        companyId: 'journey-company',
        roleId: 'journey-role',
        statement: 'Use the recorded authority boundary for refund decisions.',
        category: 'authority-boundary',
        provenance: 'source-extracted',
        lifecycleStatus: 'approved',
        sourceReferenceIds: ['journey-source-refunds'],
        createdAt: FIXED_TIME,
        updatedAt: FIXED_TIME,
        version: 1,
        topicKey: 'refunds',
      },
      {
        id: 'journey-claim-owner-only',
        companyId: 'journey-company',
        roleId: 'journey-role',
        statement: 'Owner-only unapproved discount instruction.',
        category: 'decision-rule',
        provenance: 'owner-authored',
        lifecycleStatus: 'proposed',
        sourceReferenceIds: ['journey-source-owner-only'],
        createdAt: FIXED_TIME,
        updatedAt: FIXED_TIME,
        version: 1,
        topicKey: 'discounts',
      },
    ],
    approvalDecisions: [
      {
        id: 'journey-decision-scheduling',
        claimId: 'journey-claim-scheduling',
        decision: 'approve',
        actorLabel: 'Fictional owner',
        reason: 'The exact scheduling source is current.',
        decidedAt: FIXED_TIME,
        claimVersion: 1,
      },
      {
        id: 'journey-decision-refunds',
        claimId: 'journey-claim-refunds',
        decision: 'approve',
        actorLabel: 'Fictional owner',
        reason: 'The exact refund source and structured boundary are current.',
        decidedAt: FIXED_TIME,
        claimVersion: 1,
      },
    ],
  };
}

function createJourneyService(): PhaseOneService {
  let idSequence = 0;
  let clockTick = 0;
  const service = new PhaseOneService(new InMemoryPhaseOneRepository(), {
    idFactory: (prefix) => `journey-${prefix}-${++idSequence}`,
    clock: () => new Date(Date.UTC(2026, 7, 2, 18, 0, clockTick++)).toISOString(),
    ownerFallbackDestination: 'Owner',
  });
  successful(service.initializeSnapshot(phaseThreeSeed()));
  return service;
}

function renderApp(path: string, service: PhaseOneService) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App service={service} />
    </MemoryRouter>,
  );
}

interface UiQuestionInput {
  readonly topic: string;
  readonly requestType?: string;
  readonly questionText: string;
  readonly proposedAction?: string;
  readonly amount?: string;
}

function submitQuestionThroughUi({
  topic,
  requestType = 'policy-lookup',
  questionText,
  proposedAction,
  amount,
}: UiQuestionInput): void {
  fireEvent.change(screen.getByLabelText('Operational topic'), {
    target: { value: topic },
  });
  fireEvent.change(screen.getByLabelText('Type of help'), {
    target: { value: requestType },
  });
  if (proposedAction !== undefined) {
    fireEvent.change(screen.getByLabelText('Proposed action'), {
      target: { value: proposedAction },
    });
  }
  if (amount !== undefined) {
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: amount } });
  }
  fireEvent.change(screen.getByLabelText('Operational question'), {
    target: { value: questionText },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit and evaluate question' }));
}

describe('critical Phase 3 application journeys', () => {
  it('delivers a cited informational answer with warnings and label-scoped real history', () => {
    const service = createJourneyService();
    const otherQuestionText = 'A question submitted under another employee label.';
    const otherQuestion = successful(
      service.submitEmployeeQuestion({
        employeeLabel: 'Another employee',
        questionText: otherQuestionText,
        topicKey: 'refunds',
        requestType: 'policy-lookup',
        sensitivitySelection: 'none',
        structuredContext: { requestType: 'policy-lookup' },
      }),
    );
    successful(service.evaluateEmployeeQuestion(otherQuestion.id));

    renderApp('/employee', service);

    expect(screen.getByText(/Current browser memory session only/)).toBeInTheDocument();
    expect(screen.getByText(/Do not paste sensitive values/)).toBeInTheDocument();
    expect(screen.getByText(/not legal, medical, financial, safety/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Employee label')).not.toBeInTheDocument();
    expect(screen.getByText(/Session employee label:/).closest('p')).toHaveTextContent('Employee');
    expect(screen.getByText('0 questions')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Refunds' })).not.toBeInTheDocument();
    expect(screen.queryByText(otherQuestionText)).not.toBeInTheDocument();

    const employeeQuestionText = 'Which approved scheduling guidance applies?';
    submitQuestionThroughUi({
      topic: 'scheduling',
      questionText: employeeQuestionText,
    });

    const result = screen.getByRole('region', { name: 'Approved guidance available' });
    expect(within(result).getByText(/Approved company guidance/)).toBeInTheDocument();
    expect(
      within(result).getByText('Confirm the customer arrival window before dispatch.'),
    ).toBeInTheDocument();
    expect(
      within(result).getByText(
        'This is informational guidance only. It does not authorize an action, exception, commitment, or financial decision.',
      ),
    ).toBeInTheDocument();
    const provenance = within(result).getByRole('region', {
      name: 'Sources and owner approval',
    });
    expect(within(provenance).getByText('Scheduling policy (fictional)')).toBeInTheDocument();
    expect(within(provenance).getByText(/Approved by Fictional owner/)).toBeInTheDocument();

    const history = screen.getByRole('region', { name: 'Your question history' });
    expect(within(history).getByText('1 questions')).toBeInTheDocument();
    expect(within(history).getByRole('heading', { name: 'Scheduling' })).toBeInTheDocument();
    expect(screen.queryByText(employeeQuestionText)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Owner-only unapproved discount instruction.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Owner-only unapproved note')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve claim/ })).not.toBeInTheDocument();
  });

  it('delivers matching may-decide and exact-limit financial authority', () => {
    const service = createJourneyService();
    renderApp('/employee', service);

    submitQuestionThroughUi({
      topic: 'scheduling',
      requestType: 'decision-request',
      questionText: 'May I move this fictional visit?',
      proposedAction: 'Move the visit to the next open arrival window.',
    });

    let result = screen.getByRole('region', { name: 'Approved guidance available' });
    expect(within(result).getByText('Scheduling decisions').closest('li')).toHaveTextContent(
      'may decide',
    );
    expect(service.getSnapshot().answers.at(-1)).toMatchObject({
      status: 'delivered',
      answerMode: 'approved-guidance-with-authority',
      citedAuthorityBoundaryIds: ['journey-boundary-scheduling'],
    });

    submitQuestionThroughUi({
      topic: 'refunds',
      requestType: 'financial-action',
      questionText: 'May I issue this fictional refund?',
      amount: '100',
    });

    result = screen.getByRole('region', { name: 'Approved guidance available' });
    expect(within(result).getByText('Refund actions').closest('li')).toHaveTextContent(
      'may act within limit up to USD 100',
    );
    expect(service.getSnapshot().answers.at(-1)).toMatchObject({
      status: 'delivered',
      answerMode: 'approved-guidance-with-authority',
      citedAuthorityBoundaryIds: ['journey-boundary-refunds'],
    });
    expect(service.getSnapshot().escalations).toHaveLength(0);
    expect(screen.getByText('2 questions')).toBeInTheDocument();
  });

  it('withholds an above-limit action, opens a known escalation, and creates no fake gap', () => {
    const service = createJourneyService();
    renderApp('/employee', service);

    submitQuestionThroughUi({
      topic: 'refunds',
      requestType: 'financial-action',
      questionText: 'May I issue a larger fictional refund?',
      amount: '125',
    });

    const result = screen.getByRole('region', { name: 'Owner action required' });
    expect(
      within(result).getByRole('heading', { name: 'Owner escalation opened' }),
    ).toBeInTheDocument();
    expect(within(result).getByText(/No gap was created for this outcome/)).toBeInTheDocument();
    expect(service.getSnapshot().answers.at(-1)).toMatchObject({
      status: 'escalated',
      answerMode: 'known-escalation',
    });
    expect(
      service
        .getSnapshot()
        .knowledgeGaps.some(
          ({ topicKey, status }) =>
            topicKey === 'refunds' &&
            ['open', 'question-ready', 'answered', 'proposal-created'].includes(status),
        ),
    ).toBe(false);

    fireEvent.click(within(result).getByRole('link', { name: 'Open escalation record' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Escalations' })).toBeInTheDocument();
    const card = screen.getByRole('article', { name: 'Refunds' });
    expect(within(card).getByText('Service owner')).toBeInTheDocument();
    expect(within(card).getByText('USD 125.00')).toBeInTheDocument();
    expect(within(card).getByText('Refund actions').closest('li')).toHaveTextContent(
      'may act within limit',
    );
    expect(within(card).getByText(/No knowledge gap is linked/)).toBeInTheDocument();
  });

  it('shows and resolves a missing-knowledge escalation without creating policy or resolving its gap', () => {
    const service = createJourneyService();
    renderApp('/employee', service);

    submitQuestionThroughUi({
      topic: 'payments',
      questionText: 'What is the approved payment intake policy?',
    });

    const employeeResult = screen.getByRole('region', { name: 'Owner action required' });
    expect(within(employeeResult).getByText(/withheld missing knowledge/)).toBeInTheDocument();
    expect(
      within(employeeResult).getByText(/A genuine system deficiency was linked/),
    ).toBeInTheDocument();
    fireEvent.click(within(employeeResult).getByRole('link', { name: 'Open escalation record' }));

    const escalation = service.getSnapshot().escalations[0];
    if (escalation === undefined || escalation.relatedGapId === undefined) {
      throw new Error('Expected a missing-knowledge escalation with a related gap.');
    }
    const gapBefore = service
      .getSnapshot()
      .knowledgeGaps.find(({ id }) => id === escalation.relatedGapId);
    if (gapBefore === undefined) throw new Error('Expected related knowledge gap.');
    const claimsBefore = service.getSnapshot().knowledgeClaims;
    const decisionsBefore = service.getSnapshot().approvalDecisions;

    expect(screen.getByRole('heading', { level: 1, name: 'Escalations' })).toBeInTheDocument();
    let card = screen.getByRole('article', { name: 'Payments' });
    expect(within(card).getByText(/missing knowledge/)).toBeInTheDocument();
    expect(
      within(card).getByRole('heading', { name: 'Deterministic gate trace' }),
    ).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: 'Activity trace' })).toBeInTheDocument();
    expect(within(card).getByText(/No structured boundary or rule matched/)).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Open related gap in coverage' }),
    ).toHaveAttribute('href', `/owner#gap-${gapBefore.id}`);
    expect(within(card).getByRole('link', { name: 'Start source work' })).toHaveAttribute(
      'href',
      '/sources',
    );
    expect(within(card).getByRole('link', { name: 'Start gap interview' })).toHaveAttribute(
      'href',
      '/interview',
    );
    expect(within(card).getByRole('link', { name: 'Open source-backed review' })).toHaveAttribute(
      'href',
      '/review',
    );

    fireEvent.change(within(card).getByLabelText('Assign to label'), {
      target: { value: 'Service lead' },
    });
    fireEvent.click(within(card).getByRole('button', { name: 'Assign escalation' }));
    expect(screen.getByText(/Escalation assigned/)).toBeInTheDocument();
    expect(service.getSnapshot().escalations[0]).toMatchObject({
      status: 'assigned',
      assignedToLabel: 'Service lead',
    });

    card = screen.getByRole('article', { name: 'Payments' });
    fireEvent.change(within(card).getByLabelText('Resolved by'), {
      target: { value: 'Fictional owner' },
    });
    fireEvent.change(within(card).getByLabelText('Resolution summary'), {
      target: { value: 'Handled this one payment question without creating policy.' },
    });
    fireEvent.click(within(card).getByRole('button', { name: 'Record resolution' }));

    expect(
      screen.getByText(/Resolution recorded. It did not create or approve knowledge/),
    ).toBeInTheDocument();
    expect(service.getSnapshot().knowledgeClaims).toEqual(claimsBefore);
    expect(service.getSnapshot().approvalDecisions).toEqual(decisionsBefore);
    expect(service.getSnapshot().knowledgeGaps.find(({ id }) => id === gapBefore.id)).toEqual(
      gapBefore,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close resolved escalation' }));
    expect(screen.getByText(/Resolved escalation closed/)).toBeInTheDocument();
    expect(service.getSnapshot().escalations[0]?.status).toBe('closed');
    expect(service.getSnapshot().knowledgeGaps.find(({ id }) => id === gapBefore.id)?.status).toBe(
      'open',
    );

    fireEvent.click(screen.getByRole('link', { name: 'Start source work' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Source Library' })).toBeInTheDocument();
  });
});
