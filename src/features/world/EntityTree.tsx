import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Button, TreeView, createTreeCollection } from '@chakra-ui/react';
import { Box, ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { siecsClient, type Entity, type EntityRef } from '../../client';
import { worldEditorSelectedEntityAtom } from './atom';
import { entityChildrenQuery, entityKeys, useRootEntities } from './entityQueries';

type EntityNode = Entity & { id: string; children?: EntityNode[] };

function entityNodeId(entity: EntityRef) {
  return `${entity.index}:${entity.generation}`;
}

function toEntityNode(entity: Entity): EntityNode {
  return { ...entity, id: entityNodeId(entity) };
}

function buildTree(entities: Entity[], childrenById: Map<string, Entity[]>): EntityNode[] {
  return entities.map((entity) => {
    const node = toEntityNode(entity);
    const children = childrenById.get(node.id);
    return children ? { ...node, children: buildTree(children, childrenById) } : node;
  });
}

function findEntityNode(nodes: EntityNode[], id: string): EntityNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findEntityNode(node.children ?? [], id);
    if (child) return child;
  }
  return undefined;
}

function entityRefFromNode(node: EntityNode): EntityRef {
  return { name: node.name, index: node.index, generation: node.generation };
}

function entityRefFromId(id: string): EntityRef | undefined {
  const [indexText, generationText] = id.split(':');
  if (indexText === undefined || generationText === undefined) return undefined;

  const index = Number(indexText);
  const generation = Number(generationText);
  return Number.isInteger(index) && Number.isInteger(generation)
    ? { name: '', index, generation }
    : undefined;
}

export function EntityTree() {
  const queryClient = useQueryClient();
  const rootsQuery = useRootEntities();
  const selectedEntity = useAtomValue(worldEditorSelectedEntityAtom);
  const setSelectedEntity = useSetAtom(worldEditorSelectedEntityAtom);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const cachedChildren = useMemo(() => {
    const result = new Map<string, Entity[]>();
    for (const id of expandedIds) {
      const entity = entityRefFromId(id);
      const children = entity
        ? queryClient.getQueryData<Entity[]>(entityKeys.children(entity))
        : undefined;
      if (children) result.set(id, children);
    }
    return result;
  }, [expandedIds, queryClient]);
  const preliminaryNodes = useMemo(
    () => buildTree(rootsQuery.data ?? [], cachedChildren),
    [cachedChildren, rootsQuery.data],
  );
  const expandedNodes = expandedIds
    .map((id) => findEntityNode(preliminaryNodes, id))
    .filter((node): node is EntityNode => Boolean(node));
  const childrenQueries = useQueries({
    queries: expandedNodes.map((node) => entityChildrenQuery(node, true)),
  });
  const childrenById = useMemo(() => {
    const result = new Map(cachedChildren);
    expandedNodes.forEach((node, index) => {
      const children = childrenQueries[index]?.data;
      if (children) result.set(node.id, children);
    });
    return result;
  }, [cachedChildren, childrenQueries, expandedNodes]);
  const nodes = useMemo(
    () => buildTree(rootsQuery.data ?? [], childrenById),
    [childrenById, rootsQuery.data],
  );
  const root = useMemo(
    () =>
      ({
        id: 'root',
        name: 'root',
        index: -1,
        generation: 0,
        hasChildren: true,
        children: nodes,
      }) satisfies EntityNode,
    [nodes],
  );
  const collection = useMemo(
    () =>
      createTreeCollection<EntityNode>({
        rootNode: root,
        nodeToValue: (node) => node.id,
        nodeToString: (node) => node.name,
        nodeToChildren: (node) => node.children ?? [],
      }),
    [root],
  );

  return (
    <TreeView.Root
      collection={collection}
      rounded="none"
      height="100%"
      overflowY="auto"
      bg="bg.panel"
      p={1}
      lazyMount
      expandedValue={expandedIds}
      selectedValue={selectedEntity ? [entityNodeId(selectedEntity)] : []}
      onExpandedChange={(details) => {
        const nextExpandedIds = details.expandedValue;
        setExpandedIds(nextExpandedIds);
        for (const id of nextExpandedIds) {
          if (expandedIds.includes(id)) continue;
          const node = findEntityNode(nodes, id);
          if (node) void queryClient.prefetchQuery(entityChildrenQuery(node, true));
        }
      }}
      onSelectionChange={(details) => {
        const id = details.selectedValue[0];
        const node = id ? findEntityNode(nodes, id) : undefined;
        setSelectedEntity(node ? entityRefFromNode(node) : undefined);
      }}
    >
      <TreeView.Tree gap={1}>
        <TreeView.Node
          indentGuide={<TreeView.BranchIndentGuide />}
          render={({ node, nodeState }) =>
            node.hasChildren ? (
              <TreeView.BranchControl
                my={1}
                rounded="xs"
                _hover={{ bg: 'bg.emphasized/60' }}
                _selected={{ bg: 'bg.muted' }}
              >
                {nodeState.expanded ? <ChevronDown /> : <ChevronRight />}
                <TreeView.BranchText fontSize="md">{node.name}</TreeView.BranchText>
              </TreeView.BranchControl>
            ) : (
              <TreeView.Item
                rounded="xs"
                _hover={{ bg: 'bg.emphasized/60' }}
                _selected={{ bg: 'bg.muted' }}
              >
                <Box />
                <TreeView.ItemText fontSize="md">{node.name}</TreeView.ItemText>
              </TreeView.Item>
            )
          }
        />
      </TreeView.Tree>
      <Button
        variant="outline"
        mx={1}
        onClick={async () => {
          const entity = await siecsClient.createEntity();
          queryClient.setQueryData<Entity[]>(entityKeys.roots, (current = []) =>
            current.some((item) => item.index === entity.index) ? current : [...current, entity],
          );
          queryClient.setQueryData<Entity[]>(entityKeys.all, (current = []) =>
            current.some((item) => item.index === entity.index) ? current : [...current, entity],
          );
          void queryClient.invalidateQueries({ queryKey: entityKeys.roots });
          void queryClient.invalidateQueries({ queryKey: entityKeys.all });
        }}
      >
        New entity
      </Button>
    </TreeView.Root>
  );
}
