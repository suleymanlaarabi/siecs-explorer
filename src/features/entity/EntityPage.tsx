import {
  Center,
  Splitter,
  Tabs,
  TreeView,
  createTreeCollection,
} from "@chakra-ui/react";
import { Box, ChevronDown, ChevronRight } from "lucide-react";
import { useEntities } from "../../hooks/useEntities";
import { useMemo, useState } from "react";
import { siecsClient, type Entity } from "../../client";
import { useQueryClient } from "@tanstack/react-query";

function TreeTabs() {
  return (
    <Tabs.Root defaultValue="entities" rounded={"none"}>
      <Tabs.List>
        <Tabs.Trigger value="entities">Entities</Tabs.Trigger>
        <Tabs.Trigger value="components">Components</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  );
}

type EntityNode = Entity & {
  id: string;
  children?: EntityNode[];
  childrenCount?: number;
};

function toEntityNode(entity: Entity): EntityNode {
  return {
    ...entity,
    id: `${entity.index}:${entity.generation}`,
    childrenCount: entity.hasChildren ? 1 : 0,
  };
}

function withLoadedChildren(
  loadedChildren: Record<string, EntityNode[]>,
  node: EntityNode,
): EntityNode {
  return {
    ...node,
    children: loadedChildren[node.id]?.map((node) =>
      withLoadedChildren(loadedChildren, node),
    ),
  };
}

function EntityTree() {
  const queryClient = useQueryClient();
  const { data: entities = [] } = useEntities();

  const [loadedChildren, setLoadedChildren] = useState<
    Record<string, EntityNode[]>
  >({});

  const collection = useMemo(() => {
    const root = {
      id: "root",
      name: "root",
      index: -1,
      generation: 0,
      hasChildren: true,
      children: entities
        .map(toEntityNode)
        .map((node) => withLoadedChildren(loadedChildren, node)),
    } satisfies EntityNode;

    return createTreeCollection<EntityNode>({
      rootNode: root,
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      nodeToChildren: (node) => node.children || [],
    });
  }, [entities, loadedChildren]);

  return (
    <TreeView.Root
      collection={collection}
      bg="bg.muted"
      rounded="none"
      height="100%"
      lazyMount
      loadChildren={async ({ node }) => {
        const children = await queryClient.fetchQuery({
          queryKey: ["entities", node.index, node.generation, "children"],
          queryFn: async () => {
            const entities = await siecsClient.entities(node);
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
      <TreeTabs />

      <TreeView.Tree>
        <TreeView.Node
          indentGuide={<TreeView.BranchIndentGuide />}
          render={({ node, nodeState }) =>
            node.hasChildren ? (
              <TreeView.BranchControl
                rounded="none"
                _hover={{ bg: "bg.emphasized" }}
                _selected={{ bg: "bg.emphasized" }}
              >
                {nodeState.expanded ? <ChevronDown /> : <ChevronRight />}

                <TreeView.BranchText fontSize="md">
                  {node.name}
                </TreeView.BranchText>
              </TreeView.BranchControl>
            ) : (
              <TreeView.Item
                rounded="none"
                _hover={{ bg: "bg.emphasized" }}
                _selected={{ bg: "bg.emphasized" }}
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

export function EntityPage() {
  return (
    <Splitter.Root
      panels={[{ id: "a", minSize: 15 }, { id: "b" }, { id: "c" }]}
      defaultSize={[15, 60, 25]}
      borderWidth="1px"
      minH="60"
      rounded={"md"}
    >
      <Splitter.Panel id="a">
        <EntityTree />
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="a:b" />
      <Splitter.Panel id="b">
        <Center boxSize="full" textStyle="2xl">
          B
        </Center>
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="b:c" />

      <Splitter.Panel id="c">
        <Center boxSize="full" textStyle="2xl">
          C
        </Center>
      </Splitter.Panel>
    </Splitter.Root>
  );
}
