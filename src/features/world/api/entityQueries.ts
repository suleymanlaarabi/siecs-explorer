import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query';
import { siecsClient } from '../../../lib/siecs/client';
import type { EntityRef } from '../../../lib/siecs/types';
import { entityKeys } from './queryKeys';

const entityQueryDefaults = { refetchInterval: 5000 };

export const entityQueries = {
  roots: () =>
    queryOptions({
      queryKey: entityKeys.roots(),
      queryFn: () => siecsClient.entities(),
      ...entityQueryDefaults,
    }),
  all: () =>
    queryOptions({
      queryKey: entityKeys.list(),
      queryFn: () => siecsClient.allEntities(),
      ...entityQueryDefaults,
    }),
  detail: (entity: EntityRef) =>
    queryOptions({
      queryKey: entityKeys.detail(entity),
      queryFn: () => siecsClient.entity(entity),
      ...entityQueryDefaults,
    }),
  children: (entity: EntityRef, enabled = true) =>
    queryOptions({
      queryKey: entityKeys.children(entity),
      queryFn: () => siecsClient.entityChildren(entity),
      enabled,
      ...entityQueryDefaults,
    }),
};

export function useRootEntities() {
  return useQuery(entityQueries.roots());
}

export function useAllEntities() {
  return useQuery(entityQueries.all());
}

export function useEntity(entity: EntityRef) {
  return useQuery(entityQueries.detail(entity));
}

export function useEntityChildren(entity: EntityRef, enabled: boolean) {
  return useQuery(entityQueries.children(entity, enabled));
}

export async function refreshWorldQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: entityKeys.roots() }),
    queryClient.invalidateQueries({ queryKey: entityKeys.list() }),
    queryClient.invalidateQueries({ queryKey: entityKeys.all }),
  ]);
}
