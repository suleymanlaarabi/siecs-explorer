import { Tabs } from "@chakra-ui/react";
import { EntityTree } from "./EntityTree";
import { ComponentList } from "./ComponentList";

export function WorldEditorPaneLeft() {
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
