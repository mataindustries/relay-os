import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('RelayOS application shell', () => {
  it('renders the Phase 4 product promise and preserves the deterministic policy boundary', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'RelayOS' })).toBeInTheDocument();
    expect(screen.getByText('Transfer the role, not just the instructions.')).toBeInTheDocument();
    expect(screen.getByText('Phase 4 · Pilot Launch Package')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Generated output is never company policy.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View the founding pilot' })).toHaveAttribute(
      'href',
      '/pilot',
    );
    expect(screen.getByRole('link', { name: 'Start the fictional demo' })).toHaveAttribute(
      'href',
      '/demo',
    );
    expect(screen.getByText(/No model decides whether an answer is eligible/)).toBeInTheDocument();
  });
});
