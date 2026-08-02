import { NavLink, Outlet, Route, Routes } from 'react-router-dom';

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
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { RelaySessionProvider } from './RelaySessionContext';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/pilot', label: 'Pilot' },
  { to: '/demo', label: 'Demo' },
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
        <p>RelayOS · Phase 4 pilot launch package · session-only</p>
      </footer>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
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
