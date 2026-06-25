import { atom } from "jotai";
import type { ComponentDef, Entity, Schema } from "../../client";

export const worldEditorStateAtom = atom<"entity" | "component">("entity");

export const worldEditorSelectedEntityAtom = atom<Entity | undefined>(
  undefined,
);

type ComponentDetail = { schema: Schema; component: ComponentDef };

export const worldEditorSelectedComponentAtom = atom<
  ComponentDetail | undefined
>(undefined);
