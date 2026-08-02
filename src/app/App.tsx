import { NavLink, Outlet, Route, Routes } from 'react-router-dom';

import type { PhaseOneService } from '../domain';
import { EmployeePage } from '../features/employee';
import { EscalationsPage } from '../features/escalations';
import { InterviewPage } from '../features/interview';
import { OwnerPage } from '../features/owner';
import { ReviewPage } from '../features/review';
import { SetupRoute } from '../features/setup';
import { SourcePage } from '../features/sources';
import { FuturePhasePage } from './FuturePhasePage';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { RelaySessionProvider } from './RelaySessionContext';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/setup', label: 'Setup' },
  { to: '/owner', label: 'Owner' },
  { to: '/escalations', label: 'Escalations' },
  { to: '/sources', label: 'Sources' },
  { to: '/interview', label: 'Interview' },
  { to: '/employee', label: 'Employee' },
  { to: '/review', label: 'Review' },
  { to: '/training', label: 'Training' },
  { to: '/settings', label: 'Settings' },
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
        <p>RelayOS · Phase 3 deterministic question policy firewall · session-only</p>
      </footer>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/setup" element={<SetupRoute />} />
        <Route path="/owner" element={<OwnerPage />} />
        <Route path="/escalations" element={<EscalationsPage />} />
        <Route path="/sources" element={<SourcePage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route
          path="/training"
          element={
            <FuturePhasePage
              title="Training"
              description="Training scenarios and assessment remain outside Phase 3. No training activity or scoring is available."
            />
          }
        />
        <Route
          path="/settings"
          element={
            <FuturePhasePage
              title="Settings"
              description="Durable settings, identity, and production configuration remain outside Phase 3."
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export interface AppProps {
  readonly service?: PhaseOneService | undefined;
}

export function App({ service }: AppProps) {
  return (
    <RelaySessionProvider service={service}>
      <AppRoutes />
    </RelaySessionProvider>
  );
}
