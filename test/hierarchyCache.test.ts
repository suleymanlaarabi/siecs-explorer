import { describe, expect, test } from "bun:test";
import type { Entity } from "../src/client";
import {
  markEntityHasChildren,
  moveEntityToParent,
  moveEntityToRoots,
  removeEntityFromParent,
} from "../src/features/world/hierarchyCache";

const root: Entity = { name: "Root", index: 1, generation: 1, hasChildren: false };
const firstParent: Entity = { name: "First", index: 2, generation: 1, hasChildren: true };
const secondParent: Entity = { name: "Second", index: 3, generation: 1, hasChildren: false };
const child: Entity = { name: "Child", index: 4, generation: 1, hasChildren: false };

describe("hierarchy cache helpers", () => {
  test("moves a root into a parent", () => {
    expect(moveEntityToParent([], root)).toEqual([root]);
    expect(moveEntityToRoots([], root)).toEqual([root]);
  });

  test("retargets a child without duplicating it", () => {
    const oldChildren = removeEntityFromParent([child], child);
    const newChildren = moveEntityToParent([], child);

    expect(oldChildren).toEqual([]);
    expect(newChildren).toEqual([child]);
  });

  test("restores a child to roots", () => {
    expect(moveEntityToRoots([], child)).toEqual([child]);
  });

  test("tracks parents gaining and losing their last child", () => {
    expect(markEntityHasChildren([firstParent], firstParent, false)[0].hasChildren).toBe(false);
    expect(markEntityHasChildren([secondParent], secondParent, true)[0].hasChildren).toBe(true);
  });
});
