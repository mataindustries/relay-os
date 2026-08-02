import { NavLink, Outlet, Route, Routes } from 'react-router-dom';

import { FuturePhasePage } from './FuturePhasePage';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/setup', label: 'Setup' },
  { to: '/owner', label: 'Owner' },
  { to: '/employee', label: 'Employee' },
  { to: '/review', label: 'Review' },
  { to: '/training', label: 'Training' },
  { to: '/settings', label: 'Settings' },
] as const;

const futureRoutes = [
  {
    path: '/setup',
    title: 'Setup',
    description:
      'Company and role setup belongs to a later phase. Phase 0 does not collect or save setup data.',
  },
  {
    path: '/owner',
    title: 'Owner workspace',
    description:
      'The owner workspace belongs to a later phase. No source review or policy approval workflow is active yet.',
  },
  {
    path: '/employee',
    title: 'Employee workspace',
    description:
      'Employee question answering belongs to a later phase. Phase 0 does not generate operational guidance.',
  },
  {
    path: '/review',
    title: 'Knowledge review',
    description:
      'The proposal and approval queue belongs to a later phase. Nothing can be reviewed or published in Phase 0.',
  },
  {
    path: '/training',
    title: 'Training',
    description:
      'Employee training and scenario assessment belong to a later phase. No training activity is available yet.',
  },
  {
    path: '/settings',
    title: 'Settings',
    description:
      'Company configuration belongs to a later phase. Phase 0 has no editable application settings.',
  },
] as const;

function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="wordmark" to="/" aria-label="RelayOS home">
            RelayOS
          </NavLink>
          <nav className="primary-nav" aria-label="Primary navigation">
            {navigation.map(({ to, label }) => (
              <NavLink
                className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
                end={to === '/'}
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>RelayOS · Phase 0 foundation</p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        {futureRoutes.map(({ path, title, description }) => (
          <Route
            key={path}
            path={path}
            element={<FuturePhasePage title={title} description={description} />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
