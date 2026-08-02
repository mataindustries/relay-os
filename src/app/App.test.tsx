import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('RelayOS application shell', () => {
  it('renders the Phase 0 product promise and approved-knowledge boundary', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'RelayOS' })).toBeInTheDocument();
    expect(screen.getByText('Transfer the role, not just the instructions.')).toBeInTheDocument();
    expect(screen.getByText('Phase 0 · Foundation')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Generated output is never company policy.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See the future knowledge loop' })).toHaveAttribute(
      'href',
      '#future-loop',
    );
  });
});
