import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { loadSummitComfortDemo } from '../demo';
import { PhaseOneService, type KnowledgeLifecycleStatus } from '../domain';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { App } from './App';

function createDemoService(): PhaseOneService {
  const service = new PhaseOneService(new InMemoryPhaseOneRepository());
  const loaded = loadSummitComfortDemo(service);
  if (!loaded.ok) throw loaded.error;
  return service;
}

function renderApp(path: string, service?: PhaseOneService) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App service={service} />
    </MemoryRouter>,
  );
}

function claimWithStatus(service: PhaseOneService, status: KnowledgeLifecycleStatus) {
  const claim = service
    .getSnapshot()
    .knowledgeClaims.find(({ lifecycleStatus }) => lifecycleStatus === status);
  if (claim === undefined) throw new Error(`Demo claim with status ${status} was not found.`);
  return claim;
}

function completeSetupThroughUi(): void {
  fireEvent.change(screen.getByLabelText('Business name'), {
    target: { value: 'Test Heating & Air' },
  });
  fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'HVAC services' } });
  fireEvent.change(screen.getByLabelText('Service area'), { target: { value: 'North Valley' } });
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-0100' } });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'office@testheating.example' },
  });
  fireEvent.change(screen.getByLabelText('Timezone'), {
    target: { value: 'America/Denver' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Continue to role' }));

  fireEvent.change(screen.getByLabelText('Role mission'), {
    target: { value: 'Keep every customer request moving through a safe dispatch handoff.' },
  });
  fireEvent.change(screen.getByLabelText('Role status'), { target: { value: 'active' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue to responsibilities' }));

  fireEvent.change(screen.getByLabelText('Responsibility title'), {
    target: { value: 'Maintain the dispatch board' },
  });
  fireEvent.change(screen.getByLabelText('Expected outcome'), {
    target: { value: 'Every confirmed call has an assigned technician.' },
  });
  fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'Daily' } });
  fireEvent.change(screen.getByLabelText('Completion evidence'), {
    target: { value: 'Dispatch board with assignee and arrival window' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Continue to authority and escalation' }));

  fireEvent.change(screen.getByLabelText('Authority subject'), {
    target: { value: 'Same-day schedule changes' },
  });
  fireEvent.change(screen.getByLabelText('Permission level'), {
    target: { value: 'may-act-within-limit' },
  });
  fireEvent.change(screen.getByLabelText('Limit or constraint'), {
    target: { value: 'May move a visit by no more than one hour.' },
  });
  fireEvent.change(screen.getByLabelText('Escalation destination'), {
    target: { value: 'Service manager' },
  });
  fireEvent.change(screen.getByLabelText('Escalation trigger'), {
    target: { value: 'A caller reports a gas odor.' },
  });
  fireEvent.change(screen.getByLabelText('Rule destination'), {
    target: { value: 'On-call owner' },
  });
  fireEvent.change(screen.getByLabelText('Urgency'), { target: { value: 'immediate' } });
  fireEvent.change(screen.getByLabelText('Required context'), {
    target: { value: 'Customer, address, callback number, and reported hazard' },
  });
  fireEvent.change(screen.getByLabelText('Expected response'), {
    target: { value: 'Owner acknowledges and takes over immediately.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Review setup' }));
  fireEvent.click(screen.getByRole('button', { name: 'Activate role' }));
}

describe('critical Phase 1 application journeys', () => {
  it('preserves setup draft state across in-app route navigation and activates real records', () => {
    renderApp('/setup');

    fireEvent.change(screen.getByLabelText('Business name'), {
      target: { value: 'Test Heating & Air' },
    });
    fireEvent.click(screen.getByRole('link', { name: 'Owner' }));
    expect(screen.getByRole('heading', { name: 'No role is active yet' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Setup' }));
    expect(screen.getByLabelText('Business name')).toHaveValue('Test Heating & Air');

    completeSetupThroughUi();
    expect(
      screen.getByText('Test Heating & Air and its role are active for this page session.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Owner' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Test Heating & Air' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 responsibilities')).toBeInTheDocument();
  });

  it('loads the fictional demonstration idempotently through setup', () => {
    renderApp('/setup');
    const loadButton = screen.getByRole('button', { name: 'Load fictional HVAC demo' });

    fireEvent.click(loadButton);
    expect(
      screen.getByText(
        'The fictional Summit Comfort Heating & Air demo is active for this page session.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(loadButton);
    expect(
      screen.getByText('The fictional HVAC demo was already loaded; no records were duplicated.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Owner' }));
    expect(screen.getByText('3 responsibilities')).toBeInTheDocument();
    expect(screen.getByText('10 knowledge claims')).toBeInTheDocument();
  });

  it('records owner approval and rejection interactions with append-only reasons', () => {
    const service = createDemoService();
    const initialDecisionCount = service.getSnapshot().approvalDecisions.length;
    const proposed = claimWithStatus(service, 'proposed');
    const conflicting = claimWithStatus(service, 'conflicting-information');
    renderApp('/review', service);

    const proposedCard = screen
      .getByRole('heading', { name: proposed.statement })
      .closest('article');
    if (proposedCard === null) throw new Error('Proposed review card was not found.');
    fireEvent.change(within(proposedCard).getByLabelText('Decision reason'), {
      target: { value: 'The cited arrival-window note supports this procedure.' },
    });
    fireEvent.click(
      within(proposedCard).getByRole('button', { name: `Approve claim: ${proposed.statement}` }),
    );

    const conflictingCard = screen
      .getByRole('heading', { name: conflicting.statement })
      .closest('article');
    if (conflictingCard === null) throw new Error('Conflicting review card was not found.');
    fireEvent.change(within(conflictingCard).getByLabelText('Decision reason'), {
      target: { value: 'The two fee notes conflict and cannot become policy.' },
    });
    fireEvent.click(
      within(conflictingCard).getByRole('button', {
        name: `Reject claim: ${conflicting.statement}`,
      }),
    );

    const snapshot = service.getSnapshot();
    expect(snapshot.knowledgeClaims.find(({ id }) => id === proposed.id)?.lifecycleStatus).toBe(
      'approved',
    );
    expect(snapshot.knowledgeClaims.find(({ id }) => id === conflicting.id)?.lifecycleStatus).toBe(
      'rejected',
    );
    expect(snapshot.approvalDecisions).toHaveLength(initialDecisionCount + 2);
    expect(snapshot.approvalDecisions.at(-2)?.reason).toContain('arrival-window');
    expect(snapshot.approvalDecisions.at(-1)?.reason).toContain('conflict');
  });

  it('creates and approves a revision before superseding the previous employee-visible version', () => {
    const service = createDemoService();
    const original = claimWithStatus(service, 'approved');
    const revisedStatement =
      'Revised rule: dispatchers immediately escalate reported gas, fire, electrical, or carbon-monoxide hazards without troubleshooting.';
    renderApp('/review', service);

    const originalCard = screen
      .getByRole('heading', { name: original.statement })
      .closest('article');
    if (originalCard === null) throw new Error('Approved review card was not found.');
    fireEvent.change(within(originalCard).getByLabelText('Proposed revision statement'), {
      target: { value: revisedStatement },
    });
    fireEvent.click(within(originalCard).getByRole('button', { name: 'Create proposed revision' }));

    expect(
      service.getSnapshot().knowledgeClaims.find(({ id }) => id === original.id)?.lifecycleStatus,
    ).toBe('approved');
    const revisionCard = screen.getByRole('heading', { name: revisedStatement }).closest('article');
    if (revisionCard === null) throw new Error('Revision review card was not found.');
    fireEvent.change(within(revisionCard).getByLabelText('Decision reason'), {
      target: { value: 'The revision keeps the approved safety intent and clarifies the hazards.' },
    });
    fireEvent.click(
      within(revisionCard).getByRole('button', { name: `Approve claim: ${revisedStatement}` }),
    );

    const revisedSnapshot = service.getSnapshot();
    expect(
      revisedSnapshot.knowledgeClaims.find(({ id }) => id === original.id)?.lifecycleStatus,
    ).toBe('superseded');
    expect(
      revisedSnapshot.knowledgeClaims.find(({ statement }) => statement === revisedStatement)
        ?.lifecycleStatus,
    ).toBe('approved');

    fireEvent.click(screen.getByRole('link', { name: 'Employee' }));
    expect(screen.getByRole('heading', { name: revisedStatement })).toBeInTheDocument();
    expect(screen.queryByText(original.statement)).not.toBeInTheDocument();
  });

  it('withholds every unapproved and superseded status from the employee route', () => {
    const service = createDemoService();
    const original = claimWithStatus(service, 'approved');
    const proposed = claimWithStatus(service, 'proposed');
    const rejected = claimWithStatus(service, 'rejected');
    const conflicting = claimWithStatus(service, 'conflicting-information');
    const extractedStatement = 'Extracted-only content must not be employee-visible.';
    const missingStatement = 'Missing-information content must not be employee-visible.';
    const revisedStatement = 'The current approved safety instruction for employee visibility.';

    expect(
      service.createKnowledgeClaim({
        statement: extractedStatement,
        category: 'general',
        provenance: 'source-extracted',
        lifecycleStatus: 'extracted',
        sourceReferenceIds: [],
      }).ok,
    ).toBe(true);
    expect(
      service.createKnowledgeClaim({
        statement: missingStatement,
        category: 'general',
        provenance: 'owner-authored',
        lifecycleStatus: 'missing-information',
        sourceReferenceIds: [],
      }).ok,
    ).toBe(true);
    const revision = service.createApprovedClaimRevision({
      claimId: original.id,
      statement: revisedStatement,
    });
    if (!revision.ok) throw revision.error;
    const approved = service.approveKnowledgeClaim({
      claimId: revision.value.id,
      actorLabel: 'Owner',
      reason: 'Approved to prove the current-version selector.',
    });
    if (!approved.ok) throw approved.error;

    renderApp('/employee', service);

    expect(screen.getByRole('heading', { name: revisedStatement })).toBeInTheDocument();
    for (const hiddenStatement of [
      original.statement,
      proposed.statement,
      rejected.statement,
      conflicting.statement,
      extractedStatement,
      missingStatement,
    ]) {
      expect(screen.queryByText(hiddenStatement)).not.toBeInTheDocument();
    }
  });
});
