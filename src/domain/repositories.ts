import type { PhaseOneSnapshot } from './entities';

export interface PhaseOneRepository {
  readSnapshot(): PhaseOneSnapshot;
  replaceSnapshot(next: PhaseOneSnapshot): void;
}
