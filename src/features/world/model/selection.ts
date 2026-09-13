import type { EntityRef } from '../../../lib/siecs/types';

export type WorldSelection =
  | { type: 'entity'; entity: EntityRef }
  | { type: 'component'; id: number }
  | { type: 'relation'; id: number }
  | undefined;
