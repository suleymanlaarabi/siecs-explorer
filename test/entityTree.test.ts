import { describe, expect, test } from 'bun:test';
import {
  buildEntityTree,
  entityNodeId,
  entityRefFromNode,
  entityRefFromNodeId,
  findEntityNode,
} from '../src/features/world/entities/entityTreeModel';

const root = { name: 'Root', index: 1, generation: 1, hasChildren: true };
const child = { name: 'Child', index: 2, generation: 4, hasChildren: false };

describe('entity tree helpers', () => {
  test('builds and searches a nested tree without React state', () => {
    const tree = buildEntityTree([root], new Map([[entityNodeId(root), [child]]]));
    const node = findEntityNode(tree, entityNodeId(child));

    expect(node?.name).toBe('Child');
    expect(tree[0]?.children?.[0]?.id).toBe('2:4');
  });

  test('round-trips node references and rejects invalid ids', () => {
    const tree = buildEntityTree([root], new Map());
    const rootNode = tree[0];
    expect(rootNode && entityRefFromNode(rootNode)).toEqual({
      name: 'Root',
      index: 1,
      generation: 1,
    });
    expect(entityRefFromNodeId('2:4')).toEqual({ name: '', index: 2, generation: 4 });
    expect(entityRefFromNodeId('not-an-id')).toBeUndefined();
  });
});
