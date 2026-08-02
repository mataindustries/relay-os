import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PhaseOneService } from '../domain';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { App } from './App';

function createActiveService(): PhaseOneService {
  let sequence = 0;
  const service = new PhaseOneService(new InMemoryPhaseOneRepository(), {
    idFactory: (prefix) => `journey-${prefix}-${++sequence}`,
    clock: () => '2026-08-02T15:00:00.000Z',
  });
  const setup = service.activateSetup({
    company: {
      name: 'Fictional Journey Heating',
      industry: 'Home services',
      serviceArea: 'Fictional service area',
      phone: 'Fictional contact withheld',
      email: 'journey@example.test',
      operatingTimezone: 'America/Denver',
    },
    role: {
      title: 'Home-Service Office Manager / Dispatcher',
      mission: 'Coordinate safe, complete service-call handoffs.',
      status: 'active',
      responsibilities: [
        {
          title: 'Coordinate dispatch',
          expectedOutcome: 'Every accepted call has a complete dispatch record.',
          frequency: 'Daily',
          completionEvidence: 'Dispatch record',
          status: 'active',
        },
      ],
      authorityBoundaries: [
        {
          subject: 'Company commitments',
          permissionLevel: 'must-request-approval',
          limitOrConstraint: 'Escalate commitments outside approved instructions.',
          escalationDestination: 'Owner',
          notes: '',
        },
      ],
      escalationRules: [
        {
          trigger: 'Evidence or authority is missing.',
          destination: 'Owner',
          urgency: 'same-day',
          requiredContext: 'Request and available evidence',
          expectedResponse: 'Owner determines the response.',
        },
      ],
    },
  });
  if (!setup.ok) throw setup.error;
  const reconciled = service.reconcileKnowledgeGaps();
  if (!reconciled.ok) throw reconciled.error;
  return service;
}

function renderApp(path: string, service: PhaseOneService) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App service={service} />
    </MemoryRouter>,
  );
}

describe('critical Phase 2 application journeys', () => {
  it('pastes, activates, anchors, and manually extracts a topic-assigned source claim', () => {
    const service = createActiveService();
    renderApp('/sources', service);

    expect(screen.getByText(/Current browser memory session only/)).toBeInTheDocument();
    expect(
      screen.getByText(/does not automatically interpret pasted documents/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Source title'), {
      target: { value: 'Journey dispatch SOP' },
    });
    fireEvent.change(screen.getByLabelText('Source type'), {
      target: { value: 'existing-sop' },
    });
    fireEvent.change(screen.getByLabelText('Supplier label'), {
      target: { value: 'Fictional owner' },
    });
    fireEvent.change(screen.getByLabelText('Plain text'), {
      target: {
        value:
          'Open the dispatch board.\nConfirm the technician skill match.\nRecord the arrival window.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save source draft' }));

    let documentCard = screen
      .getByRole('heading', { name: 'Journey dispatch SOP' })
      .closest('article');
    if (documentCard === null) throw new Error('Source document card not found.');
    fireEvent.click(within(documentCard).getByRole('button', { name: 'Make version 1 available' }));

    documentCard = screen.getByRole('heading', { name: 'Journey dispatch SOP' }).closest('article');
    if (documentCard === null) throw new Error('Available source document card not found.');
    expect(
      within(documentCard).getByText('Confirm the technician skill match.'),
    ).toBeInTheDocument();
    expect(within(documentCard).getByText('Record the arrival window.')).toBeInTheDocument();
    fireEvent.change(within(documentCard).getByLabelText('Start line'), {
      target: { value: '2' },
    });
    fireEvent.change(within(documentCard).getByLabelText('End line'), {
      target: { value: '3' },
    });
    expect(
      within(documentCard).getByText(
        (_content, element) =>
          element?.tagName === 'PRE' &&
          element.textContent === 'Confirm the technician skill match.\nRecord the arrival window.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      within(documentCard).getByRole('button', { name: 'Create exact line reference' }),
    );

    fireEvent.change(within(documentCard).getByLabelText('Operational topic'), {
      target: { value: 'scheduling' },
    });
    fireEvent.change(within(documentCard).getByLabelText('Proposed statement'), {
      target: {
        value: 'Confirm the technician skill match before recording the customer arrival window.',
      },
    });
    fireEvent.click(within(documentCard).getByRole('button', { name: 'Create extracted claim' }));

    const snapshot = service.getSnapshot();
    const extracted = snapshot.knowledgeClaims.find(
      ({ statement }) =>
        statement ===
        'Confirm the technician skill match before recording the customer arrival window.',
    );
    expect(extracted).toMatchObject({
      lifecycleStatus: 'extracted',
      topicKey: 'scheduling',
      provenance: 'source-extracted',
    });
    expect(snapshot.sourceReferences.at(-1)).toMatchObject({
      startLine: 2,
      endLine: 3,
      excerpt: 'Confirm the technician skill match.\nRecord the arrival window.',
    });

    fireEvent.click(screen.getByRole('link', { name: 'Owner' }));
    const schedulingCard = screen.getByRole('heading', { name: 'Scheduling' }).closest('article');
    if (schedulingCard === null) throw new Error('Scheduling coverage card not found.');
    expect(within(schedulingCard).getByText('candidate')).toBeInTheDocument();
    expect(
      within(schedulingCard).getByText(
        'Confirm the technician skill match before recording the customer arrival window.',
      ),
    ).toBeInTheDocument();
  });

  it('turns an answer into an unapproved proposal, then resolves and publishes only by approval', () => {
    const service = createActiveService();
    const legacySource = service.createSourceReference({
      sourceTitle: 'Unapproved note',
      sourceType: 'owner-note',
      sourceLocator: 'Manual note',
      excerpt: 'This candidate must remain hidden.',
    });
    if (!legacySource.ok) throw legacySource.error;
    const hiddenCandidate = service.createManualExtractedClaim({
      sourceReferenceId: legacySource.value.id,
      topicKey: 'payments',
      statement: 'Unapproved payment candidate must remain hidden.',
      category: 'procedure',
    });
    if (!hiddenCandidate.ok) throw hiddenCandidate.error;
    renderApp('/interview', service);

    expect(
      screen.getByText(/Answers remain in this browser memory session only/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Build deterministic question queue' }));
    const prompt = 'Does the company accept urgent or emergency service requests?';
    expect(screen.getByRole('heading', { name: prompt })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('No'));
    fireEvent.click(screen.getByRole('button', { name: 'Retain answer and create proposal' }));

    const answer = service.getSnapshot().interviewAnswers[0];
    if (answer === undefined) throw new Error('Interview answer not created.');
    expect(
      service.getSnapshot().knowledgeClaims.find(({ id }) => id === answer.generatedClaimId),
    ).toMatchObject({
      statement: 'No',
      lifecycleStatus: 'proposed',
      provenance: 'owner-interview-derived',
      topicKey: 'urgency-and-emergency',
    });
    expect(service.getSnapshot().knowledgeGaps.find(({ id }) => id === answer.gapId)?.status).toBe(
      'proposal-created',
    );

    fireEvent.click(screen.getByRole('link', { name: 'Review the new proposal' }));
    let proposalCard = screen.getByRole('heading', { name: 'No' }).closest('article');
    if (proposalCard === null) throw new Error('Interview proposal card not found.');
    expect(within(proposalCard).getByText(/Owner interview answer/)).toBeInTheDocument();
    expect(within(proposalCard).getByText('No', { selector: 'q' })).toBeInTheDocument();
    const approvedStatement = 'Emergency service requests are not accepted by the company.';
    fireEvent.change(within(proposalCard).getByLabelText('Editable proposed statement'), {
      target: { value: approvedStatement },
    });
    fireEvent.click(within(proposalCard).getByRole('button', { name: 'Save candidate wording' }));

    proposalCard = screen.getByRole('heading', { name: approvedStatement }).closest('article');
    if (proposalCard === null) throw new Error('Updated interview proposal card not found.');
    fireEvent.change(within(proposalCard).getByLabelText('Decision reason'), {
      target: { value: 'The retained owner answer supports this explicit rule.' },
    });
    fireEvent.click(
      within(proposalCard).getByRole('button', {
        name: `Approve claim: ${approvedStatement}`,
      }),
    );

    expect(service.getSnapshot().interviewAnswers[0]?.answer).toBe('No');
    expect(service.getSnapshot().knowledgeGaps.find(({ id }) => id === answer.gapId)).toMatchObject(
      { status: 'resolved', resolvedByClaimId: answer.generatedClaimId },
    );

    fireEvent.click(screen.getByRole('link', { name: 'Owner' }));
    const emergencyCoverage = screen
      .getByRole('heading', { name: 'Urgency and emergency' })
      .closest('article');
    if (emergencyCoverage === null) throw new Error('Emergency coverage card not found.');
    expect(within(emergencyCoverage).getByText('approved')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Employee' }));
    expect(screen.getByRole('heading', { name: approvedStatement })).toBeInTheDocument();
    expect(screen.queryByText(prompt)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Unapproved payment candidate must remain hidden.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('This candidate must remain hidden.')).not.toBeInTheDocument();
    expect(screen.queryByText('No', { selector: 'q' })).not.toBeInTheDocument();
  });
});
