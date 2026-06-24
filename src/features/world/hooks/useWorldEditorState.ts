import { useAtom } from "jotai";
import { worldEditorStateAtom } from "../atom";

export function useWorldEditorState() {
  const state = useAtom(worldEditorStateAtom);

  return state;
}
