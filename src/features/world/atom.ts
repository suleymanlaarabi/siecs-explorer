import { atom } from "jotai";
import type { ComponentDef, EntityRef, Schema } from "../../client";

export const worldEditorStateAtom = atom<"entity" | "component">("entity");

export const worldEditorSelectedEntityAtom = atom<EntityRef | undefined>(undefined);

type ComponentDetail = { schema: Schema; component: ComponentDef };

export const worldEditorSelectedComponentAtom = atom<ComponentDetail | undefined>(undefined);
