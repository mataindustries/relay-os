import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SetupPage, type SetupActionResult } from './SetupPage';
import { createInitialSetupDraft, type SetupDraft } from './setupDraft';

function SetupHarness({
  onComplete,
}: {
  readonly onComplete: (draft: SetupDraft) => SetupActionResult;
}) {
  const [draft, setDraft] = useState(createInitialSetupDraft);

  return (
    <SetupPage
      draft={draft}
      onDraftChange={setDraft}
      onComplete={onComplete}
      onLoadDemo={() => ({ ok: true, message: 'Fictional demo loaded.' })}
      hasActiveSetup={false}
    />
  );
}

describe('Phase 1 setup flow', () => {
  it('keeps the owner on the company step and shows inline required errors', () => {
    const onComplete = vi.fn(() => ({ ok: true, message: 'Setup activated.' }));
    render(<SetupHarness onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue to role' }));

    expect(screen.getByRole('group', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByText('Enter the business name.')).toBeInTheDocument();
    expect(screen.getByText('Enter the industry.')).toBeInTheDocument();
    expect(screen.getByLabelText('Business name')).toHaveAttribute('aria-invalid', 'true');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('submits one complete, active five-step role definition', () => {
    const onComplete = vi.fn(() => ({ ok: true, message: 'Setup activated for this session.' }));
    render(<SetupHarness onComplete={onComplete} />);

    fireEvent.change(screen.getByLabelText('Business name'), {
      target: { value: 'Test Heating & Air' },
    });
    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'HVAC services' } });
    fireEvent.change(screen.getByLabelText('Service area'), {
      target: { value: 'North Valley' },
    });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-0100' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'office@testheating.example' },
    });
    fireEvent.change(screen.getByLabelText('Timezone'), {
      target: { value: 'America/Denver' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to role' }));

    expect(screen.getByLabelText('Role title')).toHaveValue(
      'Home-Service Office Manager / Dispatcher',
    );
    fireEvent.change(screen.getByLabelText('Role mission'), {
      target: { value: 'Keep customer work moving from first call through dispatch.' },
    });
    fireEvent.change(screen.getByLabelText('Role status'), { target: { value: 'active' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to responsibilities' }));

    fireEvent.change(screen.getByLabelText('Responsibility title'), {
      target: { value: 'Coordinate the dispatch board' },
    });
    fireEvent.change(screen.getByLabelText('Expected outcome'), {
      target: { value: 'Every confirmed appointment has an assigned technician.' },
    });
    fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'Daily' } });
    fireEvent.change(screen.getByLabelText('Completion evidence'), {
      target: { value: 'The dispatch board shows an assignee and arrival window.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to authority and escalation' }));

    fireEvent.change(screen.getByLabelText('Authority subject'), {
      target: { value: 'Technician reassignment' },
    });
    fireEvent.change(screen.getByLabelText('Permission level'), {
      target: { value: 'may-act-within-limit' },
    });
    fireEvent.change(screen.getByLabelText('Limit or constraint'), {
      target: { value: 'Only before the technician starts travel.' },
    });
    fireEvent.change(screen.getByLabelText('Escalation destination'), {
      target: { value: 'Service manager' },
    });
    fireEvent.change(screen.getByLabelText('Escalation trigger'), {
      target: { value: 'A customer reports a gas odor.' },
    });
    fireEvent.change(screen.getByLabelText('Rule destination'), {
      target: { value: 'On-call service manager' },
    });
    fireEvent.change(screen.getByLabelText('Urgency'), { target: { value: 'immediate' } });
    fireEvent.change(screen.getByLabelText('Required context'), {
      target: { value: 'Customer name, address, callback number, and reported conditions.' },
    });
    fireEvent.change(screen.getByLabelText('Expected response'), {
      target: { value: 'Manager acknowledges and takes over the call immediately.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Review setup' }));

    expect(screen.getByRole('heading', { name: 'Review and activate' })).toBeInTheDocument();
    expect(screen.getByText('Test Heating & Air')).toBeInTheDocument();
    expect(screen.getByText('Coordinate the dispatch board')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Activate role' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({ name: 'Test Heating & Air' }),
        role: expect.objectContaining({ status: 'active' }),
        responsibilities: [
          expect.objectContaining({
            title: 'Coordinate the dispatch board',
            status: 'active',
          }),
        ],
      }),
    );
    expect(screen.getByText('Setup activated for this session.')).toBeInTheDocument();
  });
});
