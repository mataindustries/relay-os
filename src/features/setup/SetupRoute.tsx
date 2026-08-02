import { useRelaySession } from '../../app/useRelaySession';
import { SetupPage } from './SetupPage';

export function SetupRoute() {
  const session = useRelaySession();
  return (
    <SetupPage
      draft={session.setupDraft}
      onDraftChange={session.setSetupDraft}
      onComplete={session.completeSetup}
      onLoadDemo={session.loadDemo}
      hasActiveSetup={session.hasActiveSetup}
    />
  );
}
