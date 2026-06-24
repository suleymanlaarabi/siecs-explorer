import { atom } from "jotai";
import type { Component, Entity } from "../../client";

export const worldEditorStateAtom = atom<"entity" | "component">("entity");

export const worldEditorSelectedEntityAtom = atom<Entity | undefined>(
  undefined,
);
export const worldEditorSelectedComponentAtom = atom<Component | undefined>(
  undefined,
);
