import { TreeView, createTreeCollection } from "@chakra-ui/react";
import { Box, ChevronDown, ChevronRight } from "lucide-react";
import { useEntities } from "../../hooks/useEntities";
import { useMemo, useState } from "react";
import { siecsClient, type Entity } from "../../client";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { worldEditorSelectedEntityAtom } from "./atom";

type EntityNode = Entity & {
  id: number;
  children?: EntityNode[];
  childrenCount?: number;
};

function toEntityNode(entity: Entity): EntityNode {
  return {
    ...entity,
    id: entity.index,
    childrenCount: entity.hasChildren ? 1 : 0,
  };
}

function withLoadedChildren(
  loadedChildren: Record<string, EntityNode[]>,
  node: EntityNode,
): EntityNode {
  return {
    ...node,
    children: loadedChildren[node.id]?.map((node) => withLoadedChildren(loadedChildren, node)),
  };
}

function findEntityNode(nodes: EntityNode[], index: number): EntityNode | undefined {
  for (const node of nodes) {
    if (node.index === index) {
      return node;
    }

    const child = findEntityNode(node.children || [], index);
    if (child) {
      return child;
    }
  }
}

export function EntityTree() {
  const queryClient = useQueryClient();
  const { data: entities = [] } = useEntities();

  const setSelectedEntity = useSetAtom(worldEditorSelectedEntityAtom);

  const [loadedChildren, setLoadedChildren] = useState<Record<string, EntityNode[]>>({});

  const root = useMemo(() => {
    const children = entities
      .map(toEntityNode)
      .map((node) => withLoadedChildren(loadedChildren, node));

    return {
      id: 0,
      name: "root",
      index: -1,
      generation: 0,
      hasChildren: true,
      children,
    } satisfies EntityNode;
  }, [entities, loadedChildren]);

  const collection = useMemo(() => {
    return createTreeCollection<EntityNode>({
      rootNode: root,
      nodeToValue: (node) => node.id.toString(),
      nodeToString: (node) => node.name,
      nodeToChildren: (node) => node.children || [],
    });
  }, [root]);

  return (
    <TreeView.Root
      collection={collection}
      rounded="none"
      height="100%"
      bg={"bg.panel"}
      p={1}
      lazyMount
      onSelectionChange={(selected) => {
        const index = Number(selected.selectedValue);
        setSelectedEntity(findEntityNode(root.children || [], index));
      }}
      loadChildren={async ({ node }) => {
        if (node.index < 0) {
          return node.children || [];
        }

        const children = await queryClient.fetchQuery({
          queryKey: ["entities", node.index, node.generation, "children"],
          queryFn: async () => {
            const entities = await siecsClient.entityChildren(node);
            return entities.map(toEntityNode);
          },
        });

        setLoadedChildren((current) => ({
          ...current,
          [node.id]: children,
        }));

        return children;
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
                _hover={{
                  bg: "bg.emphasized/60",
                }}
                _selected={{
                  bg: "bg.muted",
                }}
              >
                {nodeState.expanded ? <ChevronDown /> : <ChevronRight />}

                <TreeView.BranchText fontSize="md">{node.name}</TreeView.BranchText>
              </TreeView.BranchControl>
            ) : (
              <TreeView.Item
                rounded="xs"
                _hover={{
                  bg: "bg.emphasized/60",
                }}
                _selected={{
                  bg: "bg.muted",
                }}
              >
                <Box />

                <TreeView.ItemText fontSize="md">{node.name}</TreeView.ItemText>
              </TreeView.Item>
            )
          }
        />
      </TreeView.Tree>
    </TreeView.Root>
  );
}
