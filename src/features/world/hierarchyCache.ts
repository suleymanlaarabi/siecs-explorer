import type { Entity, EntityRef } from "../../client";

export function moveEntityToParent(children: Entity[], entity: Entity): Entity[] {
  return children.some((item) => sameEntity(item, entity))
    ? children.map((item) => (sameEntity(item, entity) ? entity : item))
    : [...children, entity];
}

export function removeEntityFromParent(children: Entity[], entity: EntityRef): Entity[] {
  return children.filter((item) => !sameEntity(item, entity));
}

export function moveEntityToRoots(roots: Entity[], entity: Entity): Entity[] {
  return moveEntityToParent(roots, entity);
}

export function markEntityHasChildren(
  entities: Entity[],
  entity: EntityRef,
  hasChildren: boolean,
): Entity[] {
  return entities.map((item) => (sameEntity(item, entity) ? { ...item, hasChildren } : item));
}

export function sameEntity(left: EntityRef, right: EntityRef) {
  return left.index === right.index && left.generation === right.generation;
}
