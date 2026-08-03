import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { loadSummitComfortDemo, createSummitComfortDemoSnapshot } from '../demo';
import { PhaseOneService } from '../domain';
import { PilotPage } from '../features/pilot';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { App } from './App';

const VIEW_TIME = '2026-08-02T15:30:00.000Z';

function createDemoService(): PhaseOneService {
  const service = new PhaseOneService(new InMemoryPhaseOneRepository(), {
    ownerFallbackDestination: 'Owner',
  });
  const loaded = loadSummitComfortDemo(service);
  if (!loaded.ok) throw loaded.error;
  return service;
}

function renderApp(path: string, service = createDemoService()) {
  return {
    service,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <App service={service} clock={() => VIEW_TIME} />
      </MemoryRouter>,
    ),
  };
}

function createPrivateService(): PhaseOneService {
  const service = new PhaseOneService(new InMemoryPhaseOneRepository());
  const result = service.activateSetup({
    company: {
      name: 'Private client workspace',
      industry: 'Home services',
      serviceArea: 'Local area',
      phone: '555-0100',
      email: 'private@example.com',
      operatingTimezone: 'America/Denver',
    },
    role: {
      title: 'Home-Service Office Manager / Dispatcher',
      mission: 'Keep service work accurate and safely routed.',
      status: 'active',
      responsibilities: [
        {
          title: 'Maintain the schedule',
          expectedOutcome: 'Accepted calls have current assignments.',
          frequency: 'Daily',
          completionEvidence: 'Dispatch board',
          status: 'active',
        },
      ],
      authorityBoundaries: [
        {
          subject: 'Exceptions',
          permissionLevel: 'must-request-approval',
          limitOrConstraint: 'Owner approval required.',
          escalationDestination: 'Owner',
          notes: 'No automatic authority.',
        },
      ],
      escalationRules: [
        {
          trigger: 'Owner judgment is required.',
          destination: 'Owner',
          urgency: 'same-day',
          requiredContext: 'Topic and request',
          expectedResponse: 'Owner records a decision.',
        },
      ],
    },
  });
  if (!result.ok) throw result.error;
  return service;
}

describe('public pilot page', () => {
  it('renders both branded offers, product proof, the booking CTA, and honest boundaries', () => {
    const { container } = render(
      <MemoryRouter>
        <PilotPage
          bookingUrl="https://booking.example/founding-pilot"
          contactEmail="hello@example.com"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Transfer the role. Keep the judgment.')).toBeInTheDocument();
    const primaryOffer = screen
      .getByRole('heading', { name: 'RoleKeep Founding Pilot — $750' })
      .closest('article');
    expect(primaryOffer).toHaveClass('offer-card-primary');
    expect(
      screen.getByRole('heading', { name: 'RoleKeep Role Transfer Sprint — $1,250' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Up to eight priority decision areas')).toBeInTheDocument();
    expect(screen.getByText('Up to 12 core procedures or decision areas')).toBeInTheDocument();
    expect(screen.getByText('Two weeks of guided refinement')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Discuss your highest-interruption role' }),
    ).toHaveAttribute('href', 'https://booking.example/founding-pilot');
    expect(
      screen.getByRole('heading', {
        name: 'A guided delivery service with its limits stated plainly.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Current pilot boundaries')).toBeInTheDocument();
    expect(screen.getByText('Uses a fictional HVAC company and sample data.')).toBeInTheDocument();
    for (const link of [
      ['Explore the guided sample', '/demo'],
      ['See the employee question flow', '/employee'],
      ['See the owner escalation queue', '/escalations'],
      ['Preview the Role Transfer Report', '/report'],
      ['Preview the Operating Manual', '/manual'],
    ] as const) {
      expect(screen.getByRole('link', { name: new RegExp(link[0]) })).toHaveAttribute(
        'href',
        link[1],
      );
    }
    expect(container.querySelector('form')).toBeNull();
    expect(screen.queryByText(/successfully submitted/i)).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent('RelayOS');
  });

  it('uses the configured email when no valid booking URL exists', () => {
    render(
      <MemoryRouter>
        <PilotPage bookingUrl="javascript:alert(1)" contactEmail="hello@example.com" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'Discuss your highest-interruption role' }),
    ).toHaveAttribute('href', 'mailto:hello@example.com');
  });

  it('shows the exact honest fallback when neither CTA value is configured', () => {
    render(
      <MemoryRouter>
        <PilotPage bookingUrl="" contactEmail="" />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Reply to the person who shared this demo to discuss a founding pilot.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('guided fictional demo', () => {
  it('loads deterministically on entry and presents six steps with actual counts and scenarios', async () => {
    const emptyService = new PhaseOneService(new InMemoryPhaseOneRepository(), {
      ownerFallbackDestination: 'Owner',
    });
    renderApp('/demo', emptyService);

    expect(
      await screen.findByRole('heading', { name: 'Summit Comfort Heating & Air' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fictional demonstration data only/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Six explicit steps' })).toBeInTheDocument();
    for (const title of [
      'Company and role',
      'Source-backed knowledge',
      'Coverage and gaps',
      'Employee question',
      'Safe answer or escalation',
      'System improvement loop',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByText('What to notice:')).toHaveLength(6);
    expect(screen.getAllByText('Why this saves time:')).toHaveLength(6);
    expect(screen.getByText(/16 structured questions · 16 recorded outcomes/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /approve a customer discount/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Within limit')).toBeInTheDocument();
    expect(screen.getByText('Above limit')).toBeInTheDocument();
    expect(screen.getAllByText(/USD 75/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/USD 125/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('demo-decision-phase-four-discount-limit · Fictional owner'),
    ).toHaveLength(2);
    expect(
      screen.getByRole('heading', { level: 2, name: /technician is late/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Approved handling guidance')).toBeInTheDocument();
    expect(screen.getByText('Commitment exceeds authority')).toBeInTheDocument();
    expect(screen.getAllByText(/No knowledge gap was created/).length).toBeGreaterThanOrEqual(4);
    expect(document.body).not.toHaveTextContent('RelayOS');
    expect(emptyService.getSnapshot()).toEqual(createSummitComfortDemoSnapshot());
  });

  it('resets modified fictional records and does not duplicate the fixture', async () => {
    const service = createDemoService();
    const original = createSummitComfortDemoSnapshot();
    const openEscalation = service
      .getSnapshot()
      .escalations.find(({ status }) => status === 'open');
    if (openEscalation === undefined) throw new Error('Expected an open fictional escalation.');
    const assigned = service.assignEscalation(openEscalation.id, 'Changed fictional assignee');
    if (!assigned.ok) throw assigned.error;
    renderApp('/demo', service);

    fireEvent.click(screen.getByRole('button', { name: 'Reset fictional demo' }));
    await waitFor(() => expect(service.getSnapshot()).toEqual(original));
    expect(
      screen.getByText(/changes made to fictional demo records.*discarded/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset fictional demo' }));
    await waitFor(() => expect(service.getSnapshot()).toEqual(original));
  });

  it('fails closed without exposing or overwriting a non-demo session', () => {
    const service = createPrivateService();
    const before = service.getSnapshot();
    renderApp('/demo', service);

    expect(
      screen.getByRole('heading', { name: 'The public demo is isolated from this session.' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Private client workspace')).not.toBeInTheDocument();
    expect(screen.queryByText('Summit Comfort Heating & Air')).not.toBeInTheDocument();
    expect(service.getSnapshot()).toEqual(before);
  });
});

describe('report, manual, and export journeys', () => {
  it('renders the actual-record fictional report, derived priorities, and print control', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderApp('/report');

    expect(
      screen.getByRole('heading', { name: 'Summit Comfort Heating & Air' }),
    ).toBeInTheDocument();
    expect(screen.getByText('August 2, 2026')).toBeInTheDocument();
    expect(screen.getByText(/Fictional demonstration report/)).toBeInTheDocument();
    for (const heading of [
      '1. Company and role',
      '6. Approved knowledge by topic',
      '8. Open knowledge gaps',
      '12. Recommended next system-building priorities',
      '13. Provenance and approval appendix',
      '14. Current limitations',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
    expect(screen.getAllByText('Resolve the Refunds knowledge gap').length).toBeGreaterThan(0);
    expect(screen.queryByText(/independence score/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  it('renders only current approved guidance in the manual and separates known gaps', () => {
    const service = createDemoService();
    const revision = service.createApprovedClaimRevision({
      claimId: 'demo-claim-phase-four-discount-limit',
      statement:
        'A dispatcher may approve a service-recovery discount up to USD 90; a larger discount requires owner approval.',
    });
    if (!revision.ok) throw revision.error;
    const approved = service.approveKnowledgeClaim({
      claimId: revision.value.id,
      actorLabel: 'Fictional owner',
      reason: 'Approves the revised fictional limit.',
    });
    if (!approved.ok) throw approved.error;
    renderApp('/manual', service);

    expect(
      screen.getByRole('heading', { name: 'Approved guidance by operational topic' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        'A dispatcher may approve a service-recovery discount up to USD 90; a larger discount requires owner approval.',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        'A dispatcher may approve a service-recovery discount up to USD 100; a larger discount requires owner approval.',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'A dispatcher may promise a 15% service-recovery discount without approval.',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('The fee for a cancellation inside 24 hours is $79.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('No after-hours service is offered.')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Known gaps and “Do not guess” areas' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Owner-facing gap register only/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Source and approval appendix' }),
    ).toBeInTheDocument();
  });

  it('requires separate confirmation before a source-text export', () => {
    renderApp('/owner');

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /Include raw source text and source-reference excerpts/i,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Download JSON handoff' }));
    expect(
      screen.getByText(
        'Confirm the separate source-text warning before including raw source text.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /I explicitly confirm that this source text/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Phase 4 provides no import/)).toBeInTheDocument();
  });
});

describe('pilot checklists', () => {
  it('renders every intake item with a session-only disclosure and local interaction', () => {
    renderApp('/pilot/intake');

    expect(screen.getByRole('heading', { name: 'Pilot intake checklist' })).toBeInTheDocument();
    for (const item of [
      'Target role',
      'Job description',
      'Authority limits',
      'Sensitive information boundaries',
      'Available owner interview time',
    ]) {
      expect(screen.getByRole('checkbox', { name: item })).toBeInTheDocument();
    }
    expect(screen.getByText(/Completion is not persisted/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Target role' }));
    expect(screen.getByText('1 of 13 checked')).toBeInTheDocument();
  });

  it('renders every required delivery item without a persistence claim', () => {
    renderApp('/pilot/delivery');

    expect(screen.getByRole('heading', { name: 'Pilot delivery checklist' })).toBeInTheDocument();
    for (const item of [
      'Company and role verified',
      'Authority map approved',
      'Demo scenarios tested',
      'Report generated',
      'Manual generated',
      'Next review date recorded outside RoleKeep',
    ]) {
      expect(screen.getByRole('checkbox', { name: item })).toBeInTheDocument();
    }
    expect(screen.getByText(/This is not CRM, project-management/)).toBeInTheDocument();
  });
});
