import { describe, expect, test } from 'bun:test';
import type { ComponentDef, EntityDetail, RelationDef } from '../src/lib/siecs/types';
import {
  getAddableComponents,
  getAddableRelations,
  hasComponentData,
} from '../src/features/world/entityOptions';

const entity: EntityDetail = {
  name: 'Player',
  index: 42,
  generation: 1,
  children: [],
  components: [{ id: 1, name: 'Transform', value: {} }],
  relations: [
    {
      id: 10,
      name: 'ChildOf',
      target: { name: 'Scene', index: 3, generation: 1 },
    },
  ],
};

const components: ComponentDef[] = [
  { id: 1, name: 'Transform', isRelation: false, type: 0, fields: [] },
  { id: 2, name: 'Health', isRelation: false, type: 0, fields: [] },
  { id: 10, name: 'ChildOf', isRelation: true, type: 0, fields: [] },
];

const relations: RelationDef[] = [
  { id: 10, name: 'ChildOf', storage: 0, onDeleteTarget: 0, acyclic: true },
  { id: 11, name: 'Likes', storage: 0, onDeleteTarget: 0, acyclic: false },
];

describe('entity inspector addable schema entries', () => {
  test('returns only missing non-relation components matching the search', () => {
    expect(
      getAddableComponents(components, entity.components, 'hea').map((item) => item.id),
    ).toEqual([2]);
  });

  test('returns only missing relations matching the search', () => {
    expect(getAddableRelations(relations, entity.relations, 'lik').map((item) => item.id)).toEqual([
      11,
    ]);
  });

  test('treats null and undefined component values as data-less tags', () => {
    expect(hasComponentData(null)).toBe(false);
    expect(hasComponentData(undefined)).toBe(false);
    expect(hasComponentData(false)).toBe(true);
    expect(hasComponentData(0)).toBe(true);
    expect(hasComponentData({})).toBe(true);
  });
});
