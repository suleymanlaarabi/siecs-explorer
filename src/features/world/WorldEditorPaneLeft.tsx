import { Tabs } from "@chakra-ui/react";
import { EntityTree } from "./EntityTree";
import { ComponentList } from "./ComponentList";
import { useSetAtom } from "jotai";
import { worldEditorStateAtom } from "./atom";
import { RelationList } from "./RelationList";

export function WorldEditorPaneLeft() {
  const setEditorState = useSetAtom(worldEditorStateAtom);

  return (
    <Tabs.Root
      defaultValue="entity"
      h={"full"}
      minH={0}
      display="flex"
      flexDirection="column"
      rounded={"none"}
      lazyMount
      unmountOnExit
      onValueChange={(tab) => {
        setEditorState(tab.value as "entity" | "component" | "relation");
      }}
    >
      <Tabs.List>
        <Tabs.Trigger value="entity">Entities</Tabs.Trigger>
        <Tabs.Trigger value="component">Components</Tabs.Trigger>
        <Tabs.Trigger value="relation">Relations</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="entity" flex="1" minH={0} p={0} m={0}>
        <EntityTree />
      </Tabs.Content>
      <Tabs.Content value="component" flex="1" minH={0} p={0} m={0}>
        <ComponentList />
      </Tabs.Content>
      <Tabs.Content value="relation" flex="1" minH={0} p={0} m={0}>
        <RelationList />
      </Tabs.Content>
    </Tabs.Root>
  );
}
