import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('RoleKeep application shell', () => {
  it('renders the canonical sales landing page at the root with the RoleKeep promise', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'RoleKeep' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'RoleKeep home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Transfer the role. Keep the judgment.')).toBeInTheDocument();
    expect(
      screen.getByText('The role-transfer system for owner-led service businesses.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Founding pilots from $750 · One role · Guided implementation'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore the sample HVAC workspace' })).toHaveAttribute(
      'href',
      '/demo',
    );
    expect(screen.getByText('Uses a fictional HVAC company and sample data.')).toBeInTheDocument();
    expect(
      screen.getByText('RoleKeep · Founding pilot · Sample data only on the public demo'),
    ).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('RelayOS');
    expect(document.body).not.toHaveTextContent('Phase 4 · Pilot Launch Package');
  });

  it('uses the restrained mobile-ready public navigation without workspace links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Public navigation' });
    expect(navigation).toHaveClass('public-nav');
    expect(navigation).toHaveAttribute('data-navigation', 'public');
    expect(within(navigation).getByRole('link', { name: 'How it works' })).toHaveAttribute(
      'href',
      '/#how-it-works',
    );
    expect(within(navigation).getByRole('link', { name: 'Sample demo' })).toHaveAttribute(
      'href',
      '/demo',
    );
    expect(within(navigation).getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'href',
      '/#pricing',
    );
    expect(within(navigation).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/#contact',
    );
    for (const internalLabel of ['Setup', 'Owner', 'Escalations', 'Sources', 'Employee']) {
      expect(
        within(navigation).queryByRole('link', { name: internalLabel }),
      ).not.toBeInTheDocument();
    }
  });
});
