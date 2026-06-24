import { Center, Splitter } from "@chakra-ui/react";
import { WorldEditorPaneLeft } from "./WorldEditorPaneLeft";
import { WorldEditorPaneRight } from "./WorldEditorPaneRight";

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
        <WorldEditorPaneLeft />
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="a:b" />
      <Splitter.Panel id="b">
        <Center boxSize="full" textStyle="2xl">
          B
        </Center>
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="b:c" />

      <Splitter.Panel id="c">
        <WorldEditorPaneRight />
      </Splitter.Panel>
    </Splitter.Root>
  );
}
