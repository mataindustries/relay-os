import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('RelayOS application shell', () => {
  it('renders the Phase 3 product promise and deterministic policy boundary', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'RelayOS' })).toBeInTheDocument();
    expect(screen.getByText('Transfer the role, not just the instructions.')).toBeInTheDocument();
    expect(screen.getByText('Phase 3 · Deterministic Question-to-System')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Generated output is never company policy.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See the reviewed operating loop' })).toHaveAttribute(
      'href',
      '#operating-loop',
    );
    expect(screen.getByText(/No model decides whether an answer is eligible/)).toBeInTheDocument();
  });
});
