import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

const functionalRoutes = [
  ['/setup', 'Define the role being transferred'],
  ['/owner', 'No role is active yet'],
  ['/escalations', 'No active role escalation queue'],
  ['/sources', 'No active role for source intake'],
  ['/interview', 'No active role to interview'],
  ['/employee', 'No active role knowledge'],
  ['/review', 'No active role to review'],
] as const;

const laterPhaseRoutes = [
  ['/training', 'Training'],
  ['/settings', 'Settings'],
] as const;

describe('application routes', () => {
  it.each(functionalRoutes)('renders the functional Phase 3 route %s', (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it.each(laterPhaseRoutes)('keeps %s as an honest later-phase placeholder', (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByText('Later-phase feature')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
