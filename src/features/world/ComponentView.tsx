import { useAtomValue } from "jotai";
import { worldEditorSelectedComponentAtom } from "./atom";

export function ComponentView() {
  const selectedComponent = useAtomValue(worldEditorSelectedComponentAtom);

  console.log(selectedComponent);
  if (!selectedComponent) {
    return null;
  }

  return <>{selectedComponent.name}</>;
}
