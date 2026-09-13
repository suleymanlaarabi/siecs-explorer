import { atom } from "jotai";
import type {
  ComponentDef,
  EntityRef,
  RelationDef,
  Schema,
} from "../../client";

export const worldEditorStateAtom = atom<"entity" | "component" | "relation">(
  "entity",
);

export const worldEditorSelectedEntityAtom = atom<EntityRef | undefined>(
  undefined,
);

export const worldEntityTreeRevisionAtom = atom(0);

type ComponentDetail = { schema: Schema; component: ComponentDef };

export const worldEditorSelectedComponentAtom = atom<
  ComponentDetail | undefined
>(undefined);

type RelationDetail = { schema: Schema; relation: RelationDef };

export const worldEditorSelectedRelationAtom = atom<RelationDetail | undefined>(
  undefined,
);
