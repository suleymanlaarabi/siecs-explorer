import { describe, expect, test } from 'bun:test';
import type { WorldSelection } from '../src/features/world/model/selection';

describe('world selection', () => {
  test('keeps only serialisable selection identity, never schema data', () => {
    const selections: WorldSelection[] = [
      { type: 'entity', entity: { name: 'Player', index: 1, generation: 0 } },
      { type: 'component', id: 3 },
      { type: 'relation', id: 7 },
      undefined,
    ];

    expect(selections.map((selection) => selection?.type)).toEqual([
      'entity',
      'component',
      'relation',
      undefined,
    ]);
  });
});
