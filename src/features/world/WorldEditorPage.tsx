import { Center, Splitter, Tabs } from "@chakra-ui/react";
import { EntityTree } from "./EntityTree";
import { ComponentList } from "./ComponentList";

function TreeTabs() {
  return (
    <Tabs.Root defaultValue="entities" h={"full"} rounded={"none"} lazyMount>
      <Tabs.List>
        <Tabs.Trigger value="entities">Entities</Tabs.Trigger>
        <Tabs.Trigger value="components">Components</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="entities" h={"full"} p={0} m={0}>
        <EntityTree />
      </Tabs.Content>
      <Tabs.Content value="components" p={0} m={0}>
        <ComponentList />
      </Tabs.Content>
    </Tabs.Root>
  );
}

export function WorldEditorPage() {
  return (
    <Splitter.Root
      panels={[{ id: "a", minSize: 15 }, { id: "b" }, { id: "c" }]}
      defaultSize={[15, 60, 25]}
      borderWidth="1px"
      minH="60"
      rounded={"md"}
    >
      <Splitter.Panel id="a" bg={"bg.panel"}>
        <TreeTabs />
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
