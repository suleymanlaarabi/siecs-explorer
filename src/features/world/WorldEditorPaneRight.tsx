import { useAtomValue } from "jotai";
import { ComponentView } from "./ComponentView";
import { worldEditorStateAtom } from "./atom";
import { EntityView } from "./EntityView";

export function WorldEditorPaneRight() {
  const editorState = useAtomValue(worldEditorStateAtom);

  return editorState === "entity" ? <EntityView /> : <ComponentView />;
}
