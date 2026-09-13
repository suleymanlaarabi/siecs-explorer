import type { ComponentDef, EntityComponent, EntityRelation, RelationDef } from '../../client';

export function hasComponentData(value: unknown) {
  return value !== null && value !== undefined;
}

export function getAddableComponents(
  definitions: ComponentDef[],
  current: EntityComponent[],
  search: string,
) {
  const present = new Set(current.map((component) => component.id));
  const normalized = search.trim().toLowerCase();
  return definitions.filter(
    (component) =>
      !component.isRelation &&
      !present.has(component.id) &&
      component.name.toLowerCase().includes(normalized),
  );
}

export function getAddableRelations(
  definitions: RelationDef[],
  current: EntityRelation[],
  search: string,
) {
  const present = new Set(current.map((relation) => relation.id));
  const normalized = search.trim().toLowerCase();
  return definitions.filter(
    (relation) => !present.has(relation.id) && relation.name.toLowerCase().includes(normalized),
  );
}
