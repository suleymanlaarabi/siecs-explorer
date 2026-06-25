import { Tabs } from "@chakra-ui/react";
import { EntityTree } from "./EntityTree";
import { ComponentList } from "./ComponentList";
import { useSetAtom } from "jotai";
import { worldEditorStateAtom } from "./atom";

export function WorldEditorPaneLeft() {
  const setEditorState = useSetAtom(worldEditorStateAtom);

  return (
    <Tabs.Root
      defaultValue="entities"
      h={"full"}
      rounded={"none"}
      lazyMount
      onValueChange={(tab) => {
        setEditorState(tab.value as "entity" | "component");
      }}
    >
      <Tabs.List>
        <Tabs.Trigger value="entity">Entities</Tabs.Trigger>
        <Tabs.Trigger value="component">Components</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="entity" h={"full"} p={0} m={0}>
        <EntityTree />
      </Tabs.Content>
      <Tabs.Content value="component" p={0} m={0}>
        <ComponentList />
      </Tabs.Content>
    </Tabs.Root>
  );
}
