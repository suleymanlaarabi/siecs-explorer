import type { EntityLike, EntityRef } from './types';

export function entityId(entity: EntityLike): number {
  return typeof entity === 'object' ? entity.index : entity;
}

export function sameEntity(left: EntityRef, right: EntityRef): boolean {
  return left.index === right.index && left.generation === right.generation;
}

export function entityKey(entity: EntityRef): string {
  return `${entity.index}:${entity.generation}`;
}
