import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo, useState } from 'react';
import type { Entity } from '../../../lib/siecs/types';
import { entityQueries, useRootEntities } from '../api/entityQueries';
import { entityKeys } from '../api/queryKeys';
import { worldSelectionAtom } from '../model/worldEditorState';
import { useCreateEntity } from '../api/entityMutations';
import {
  buildEntityTree,
  entityNodeId,
  entityRefFromNode,
  entityRefFromNodeId,
  findEntityNode,
  type EntityNode,
} from './entityTreeModel';

export function useEntityTree() {
  const queryClient = useQueryClient();
  const rootsQuery = useRootEntities();
  const selection = useAtomValue(worldSelectionAtom);
  const setSelection = useSetAtom(worldSelectionAtom);
  const createEntity = useCreateEntity();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const cachedChildren = useMemo(() => {
    const childrenById = new Map<string, Entity[]>();
    for (const id of expandedIds) {
      const entity = entityRefFromNodeId(id);
      const children = entity
        ? queryClient.getQueryData<Entity[]>(entityKeys.children(entity))
        : undefined;
      if (children) childrenById.set(id, children);
    }
    return childrenById;
  }, [expandedIds, queryClient]);
  const preliminaryNodes = useMemo(
    () => buildEntityTree(rootsQuery.data ?? [], cachedChildren),
    [cachedChildren, rootsQuery.data],
  );
  const expandedNodes = useMemo(
    () =>
      expandedIds
        .map((id) => findEntityNode(preliminaryNodes, id))
        .filter((node): node is EntityNode => node !== undefined),
    [expandedIds, preliminaryNodes],
  );
  const childrenQueries = useQueries({
    queries: expandedNodes.map((node) => entityQueries.children(node)),
  });
  const nodes = useMemo(() => {
    const childrenById = new Map(cachedChildren);
    expandedNodes.forEach((node, index) => {
      const children = childrenQueries[index]?.data;
      if (children) childrenById.set(node.id, children);
    });
    return buildEntityTree(rootsQuery.data ?? [], childrenById);
  }, [cachedChildren, childrenQueries, expandedNodes, rootsQuery.data]);

  const expand = useCallback(
    (nextExpandedIds: string[]) => {
      setExpandedIds(nextExpandedIds);
      for (const id of nextExpandedIds) {
        if (expandedIds.includes(id)) continue;
        const node = findEntityNode(nodes, id);
        if (node) void queryClient.prefetchQuery(entityQueries.children(node));
      }
    },
    [expandedIds, nodes, queryClient],
  );
  const select = useCallback(
    (id: string | undefined) => {
      const node = id ? findEntityNode(nodes, id) : undefined;
      setSelection(node ? { type: 'entity', entity: entityRefFromNode(node) } : undefined);
    },
    [nodes, setSelection],
  );

  return {
    nodes,
    expandedIds,
    selectedId: selection?.type === 'entity' ? entityNodeId(selection.entity) : undefined,
    isLoading: rootsQuery.isLoading,
    expand,
    select,
    createEntity: () => createEntity.mutate(),
    isCreating: createEntity.isPending,
  };
}
