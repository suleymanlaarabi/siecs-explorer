import type { EntityComponent, EntityDetail, EntityRelation } from '../../../lib/siecs/types';

export function addComponentToEntity(
  entity: EntityDetail,
  component: EntityComponent,
): EntityDetail {
  return { ...entity, components: [...entity.components, component] };
}

export function setComponentOnEntity(
  entity: EntityDetail,
  component: EntityComponent,
): EntityDetail {
  return {
    ...entity,
    components: entity.components.map((item) => (item.id === component.id ? component : item)),
  };
}

export function removeComponentFromEntity(entity: EntityDetail, componentId: number): EntityDetail {
  return { ...entity, components: entity.components.filter((item) => item.id !== componentId) };
}

export function setRelationOnEntity(entity: EntityDetail, relation: EntityRelation): EntityDetail {
  const exists = entity.relations.some((item) => item.id === relation.id);
  return {
    ...entity,
    relations: exists
      ? entity.relations.map((item) => (item.id === relation.id ? relation : item))
      : [...entity.relations, relation],
  };
}

export function removeRelationFromEntity(entity: EntityDetail, relationId: number): EntityDetail {
  return { ...entity, relations: entity.relations.filter((item) => item.id !== relationId) };
}
