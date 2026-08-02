import { useContext } from 'react';

import { RelaySessionContext, type RelaySessionValue } from './relaySessionContext';

export function useRelaySession(): RelaySessionValue {
  const value = useContext(RelaySessionContext);
  if (value === null) throw new Error('RelaySessionProvider is required.');
  return value;
}
