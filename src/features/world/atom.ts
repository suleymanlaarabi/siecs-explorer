import { atom } from "jotai";
import type { ComponentDef, Entity } from "../../client";

export const worldEditorStateAtom = atom<"entity" | "component">("entity");

export const worldEditorSelectedEntityAtom = atom<Entity | undefined>(
  undefined,
);
export const worldEditorSelectedComponentAtom = atom<ComponentDef | undefined>(
  undefined,
);
