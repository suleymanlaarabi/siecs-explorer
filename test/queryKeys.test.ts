import { describe, expect, test } from 'bun:test';
import { entityKeys, isEntityChildrenQuery } from '../src/features/world/api/queryKeys';

const entity = { name: 'Player', index: 42, generation: 3 };

describe('entity query keys', () => {
  test('builds stable, hierarchical keys', () => {
    expect(entityKeys.roots()).toEqual(['entities', 'roots']);
    expect(entityKeys.list()).toEqual(['entities', 'list']);
    expect(entityKeys.detail(entity)).toEqual(['entities', 'detail', 42, 3]);
    expect(entityKeys.children(entity)).toEqual(['entities', 'detail', 42, 3, 'children']);
  });

  test('recognises only children queries', () => {
    expect(isEntityChildrenQuery(entityKeys.children(entity))).toBe(true);
    expect(isEntityChildrenQuery(entityKeys.detail(entity))).toBe(false);
  });
});
