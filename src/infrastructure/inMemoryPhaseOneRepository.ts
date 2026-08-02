import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  type PhaseOneRepository,
  type PhaseOneSnapshot,
} from '../domain';

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    ) as T;
  }

  return value;
}

/**
 * Session-only Phase 0-3 storage. Both sides of the boundary are copied so a
 * caller cannot mutate repository state without a domain operation.
 */
export class InMemoryPhaseOneRepository implements PhaseOneRepository {
  private snapshot: PhaseOneSnapshot;

  constructor(initialSnapshot: PhaseOneSnapshot = EMPTY_PHASE_ONE_SNAPSHOT) {
    this.snapshot = cloneValue(initialSnapshot);
  }

  readSnapshot(): PhaseOneSnapshot {
    return cloneValue(this.snapshot);
  }

  replaceSnapshot(next: PhaseOneSnapshot): void {
    this.snapshot = cloneValue(next);
  }
}
