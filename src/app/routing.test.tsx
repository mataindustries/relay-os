import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

const routes = [
  ['/setup', 'Setup'],
  ['/owner', 'Owner workspace'],
  ['/employee', 'Employee workspace'],
  ['/review', 'Knowledge review'],
  ['/training', 'Training'],
  ['/settings', 'Settings'],
] as const;

describe('application routes', () => {
  it.each(routes)('renders %s as an honest later-phase placeholder', (path, heading) => {
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
