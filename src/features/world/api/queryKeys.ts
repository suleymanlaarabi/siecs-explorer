import type { EntityRef } from '../../../lib/siecs/types';

export const entityKeys = {
  all: ['entities'] as const,
  roots: () => [...entityKeys.all, 'roots'] as const,
  list: () => [...entityKeys.all, 'list'] as const,
  detail: (entity: EntityRef) =>
    [...entityKeys.all, 'detail', entity.index, entity.generation] as const,
  children: (entity: EntityRef) => [...entityKeys.detail(entity), 'children'] as const,
};

export const schemaKeys = { all: ['schema'] as const };

export const healthKeys = { all: ['health'] as const };

export function isEntityChildrenQuery(queryKey: readonly unknown[]) {
  return queryKey[0] === 'entities' && queryKey[1] === 'detail' && queryKey[4] === 'children';
}
