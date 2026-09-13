import { useQuery, type QueryClient } from "@tanstack/react-query";
import { siecsClient, type EntityRef } from "../../client";

export const entityKeys = {
  all: ["entities", "all"] as const,
  roots: ["entities", "roots"] as const,
  detail: (entity: EntityRef) => ["entity", entity.index, entity.generation] as const,
  children: (entity: EntityRef) => ["entity", entity.index, entity.generation, "children"] as const,
  entity: ["entity"] as const,
};

export async function refreshWorldQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: entityKeys.roots }),
    queryClient.invalidateQueries({ queryKey: entityKeys.all }),
    queryClient.invalidateQueries({ queryKey: entityKeys.entity }),
  ]);
}

export function isEntityChildrenQuery(queryKey: readonly unknown[]) {
  return queryKey.length === 4 && queryKey[0] === "entity" && queryKey[3] === "children";
}

export function useRootEntities() {
  return useQuery({
    queryKey: entityKeys.roots,
    queryFn: () => siecsClient.entities(),
    refetchInterval: 5000,
  });
}

export function useAllEntities() {
  return useQuery({
    queryKey: entityKeys.all,
    queryFn: () => siecsClient.allEntities(),
    refetchInterval: 5000,
  });
}

export function useEntity(entity: EntityRef) {
  return useQuery({
    queryKey: entityKeys.detail(entity),
    queryFn: () => siecsClient.entity(entity),
    refetchInterval: 5000,
  });
}

export function entityChildrenQuery(entity: EntityRef, enabled = true) {
  return {
    queryKey: entityKeys.children(entity),
    queryFn: () => siecsClient.entityChildren(entity),
    enabled,
    refetchInterval: 5000,
  };
}

export function useEntityChildren(entity: EntityRef, enabled: boolean) {
  return useQuery(entityChildrenQuery(entity, enabled));
}
