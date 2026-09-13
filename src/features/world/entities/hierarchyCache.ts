import { sameEntity } from '../../../lib/siecs/entity';
import type { Entity, EntityRef } from '../../../lib/siecs/types';

export { sameEntity };

export function moveEntityToParent(entities: Entity[], entity: Entity): Entity[] {
  return entities.some((item) => sameEntity(item, entity)) ? entities : [...entities, entity];
}

export function moveEntityToRoots(entities: Entity[], entity: Entity): Entity[] {
  return moveEntityToParent(entities, entity);
}

export function removeEntityFromParent(entities: Entity[], entity: EntityRef): Entity[] {
  return entities.filter((item) => !sameEntity(item, entity));
}

export function markEntityHasChildren(
  entities: Entity[],
  entity: EntityRef,
  hasChildren: boolean,
): Entity[] {
  return entities.map((item) => (sameEntity(item, entity) ? { ...item, hasChildren } : item));
}
