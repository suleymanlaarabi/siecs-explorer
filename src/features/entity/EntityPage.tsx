import {
  Center,
  Splitter,
  Tabs,
  TreeView,
  createTreeCollection,
} from "@chakra-ui/react";
import { Box, ChevronDown, ChevronRight } from "lucide-react";

interface Node {
  id: string;
  name: string;
  children?: Node[];
}

const collection = createTreeCollection<Node>({
  nodeToValue: (node) => node.id,
  nodeToString: (node) => node.name,
  rootNode: {
    id: "ROOT",
    name: "",
    children: [
      {
        id: "node_modules",
        name: "node_modules",
        children: [
          { id: "node_modules/zag-js", name: "zag-js" },
          { id: "node_modules/pandacss", name: "panda" },
          {
            id: "node_modules/@types",
            name: "@types",
            children: [
              { id: "node_modules/@types/react", name: "react" },
              { id: "node_modules/@types/react-dom", name: "react-dom" },
            ],
          },
        ],
      },
      {
        id: "src",
        name: "src",
        children: [
          { id: "src/app.tsx", name: "app.tsx" },
          { id: "src/index.ts", name: "index.ts" },
        ],
      },
      { id: "panda.config", name: "panda.config.ts" },
      { id: "package.json", name: "package.json" },
      { id: "renovate.json", name: "renovate.json" },
      { id: "readme.md", name: "README.md" },
    ],
  },
});

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

function EntityTree() {
  return (
    <TreeView.Root
      collection={collection}
      bg="bg.muted"
      rounded={"none"}
      height="100%"
    >
      <TreeTabs />
      <TreeView.Tree>
        <TreeView.Node
          indentGuide={<TreeView.BranchIndentGuide />}
          render={({ node, nodeState }) =>
            nodeState.isBranch ? (
              <TreeView.BranchControl
                _hover={{
                  bg: "bg.emphasized",
                }}
                _selected={{
                  bg: "bg.emphasized",
                }}
                rounded={"none"}
              >
                {nodeState.expanded ? <ChevronDown /> : <ChevronRight />}
                <TreeView.BranchText fontSize={"md"}>
                  {node.name}
                </TreeView.BranchText>
              </TreeView.BranchControl>
            ) : (
              <TreeView.Item
                _hover={{
                  bg: "bg.emphasized",
                }}
                _selected={{
                  bg: "bg.emphasized",
                }}
                rounded={"none"}
              >
                <Box />
                <TreeView.ItemText fontSize={"md"}>
                  {node.name}
                </TreeView.ItemText>
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
