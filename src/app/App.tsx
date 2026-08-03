import { Link, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import type { PhaseOneService } from '../domain';
import { DemoPage } from '../features/demo';
import { ManualPage, PilotChecklistPage, ReportPage } from '../features/delivery';
import { EmployeePage } from '../features/employee';
import { EscalationsPage } from '../features/escalations';
import { InterviewPage } from '../features/interview';
import { OwnerPage } from '../features/owner';
import { PilotPage } from '../features/pilot';
import { ReviewPage } from '../features/review';
import { SetupRoute } from '../features/setup';
import { SourcePage } from '../features/sources';
import { FuturePhasePage } from './FuturePhasePage';
import { NotFoundPage } from './NotFoundPage';
import { RelaySessionProvider } from './RelaySessionContext';

const publicNavigation = [
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/demo', label: 'Sample demo' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#contact', label: 'Contact' },
] as const;

const workspaceNavigation = [
  { to: '/demo', label: 'Sample demo' },
  { to: '/setup', label: 'Setup' },
  { to: '/owner', label: 'Owner' },
  { to: '/escalations', label: 'Escalations' },
  { to: '/sources', label: 'Sources' },
  { to: '/interview', label: 'Interview' },
  { to: '/employee', label: 'Employee' },
  { to: '/review', label: 'Review' },
  { to: '/report', label: 'Report' },
  { to: '/manual', label: 'Manual' },
  { to: '/training', label: 'Training' },
  { to: '/settings', label: 'Settings' },
] as const;

function AppShell() {
  const { pathname } = useLocation();
  const isPublicRoute = pathname === '/' || pathname === '/pilot' || pathname === '/demo';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className={isPublicRoute ? 'header-inner public-header-inner' : 'header-inner'}>
          <Link className="wordmark" to="/" aria-label="RoleKeep home">
            RoleKeep
          </Link>
          {isPublicRoute ? (
            <nav
              className="primary-nav public-nav"
              aria-label="Public navigation"
              data-navigation="public"
            >
              {publicNavigation.map(({ to, label }) => (
                <Link className="nav-link" key={to} to={to}>
                  {label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav
              className="primary-nav workspace-nav"
              aria-label="Workspace navigation"
              data-navigation="workspace"
            >
              {workspaceNavigation.map(({ to, label }) => (
                <NavLink
                  className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
                  key={to}
                  to={to}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main id="main-content" className="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>RoleKeep · Founding pilot · Sample data only on the public demo</p>
      </footer>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<PilotPage />} />
        <Route path="/pilot" element={<PilotPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/manual" element={<ManualPage />} />
        <Route path="/pilot/intake" element={<PilotChecklistPage kind="intake" />} />
        <Route path="/pilot/delivery" element={<PilotChecklistPage kind="delivery" />} />
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
              description="Training scenarios and assessment remain outside Phase 4. No training activity or scoring is available."
            />
          }
        />
        <Route
          path="/settings"
          element={
            <FuturePhasePage
              title="Settings"
              description="Durable settings, identity, and production configuration remain outside Phase 4."
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
  readonly clock?: (() => string) | undefined;
}

export function App({ service, clock }: AppProps) {
  return (
    <RelaySessionProvider service={service} clock={clock}>
      <AppRoutes />
    </RelaySessionProvider>
  );
}
