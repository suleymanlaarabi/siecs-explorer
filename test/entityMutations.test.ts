import { describe, expect, test } from 'bun:test';
import type { EntityDetail } from '../src/client';
import {
  addComponentToEntity,
  removeComponentFromEntity,
  removeRelationFromEntity,
  setComponentOnEntity,
  setRelationOnEntity,
} from '../src/features/world/hooks/useEntityMutations';

const entity: EntityDetail = {
  name: 'Player',
  index: 42,
  generation: 1,
  children: [],
  components: [{ id: 1, name: 'Transform', value: { x: 1 } }],
  relations: [
    {
      id: 10,
      name: 'ChildOf',
      target: { name: 'Old scene', index: 2, generation: 1 },
    },
  ],
};

describe('entity mutation cache updates', () => {
  test('appends a created component', () => {
    const created = { id: 2, name: 'Health', value: 100 };
    expect(addComponentToEntity(entity, created).components).toEqual([
      entity.components[0],
      created,
    ]);
  });

  test('removes a component by id', () => {
    expect(removeComponentFromEntity(entity, 1).components).toEqual([]);
  });

  test('replaces a saved component', () => {
    const saved = { id: 1, name: 'Transform', value: { x: 2 } };
    expect(setComponentOnEntity(entity, saved).components).toEqual([saved]);
  });

  test('replaces an existing relation', () => {
    const changed = {
      id: 10,
      name: 'ChildOf',
      target: { name: 'New scene', index: 3, generation: 1 },
    };
    expect(setRelationOnEntity(entity, changed).relations).toEqual([changed]);
  });

  test('appends a new relation', () => {
    const created = {
      id: 11,
      name: 'Likes',
      target: { name: 'Camera', index: 4, generation: 1 },
    };
    expect(setRelationOnEntity(entity, created).relations).toEqual([entity.relations[0], created]);
  });

  test('removes a relation by id', () => {
    expect(removeRelationFromEntity(entity, 10).relations).toEqual([]);
  });
});
