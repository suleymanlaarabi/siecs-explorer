import type { Entity, EntityRef } from '../../../lib/siecs/types';
import { entityKey } from '../../../lib/siecs/entity';

export type EntityNode = Entity & { id: string; children?: EntityNode[] };

export function entityNodeId(entity: EntityRef): string {
  return entityKey(entity);
}

export function toEntityNode(entity: Entity): EntityNode {
  return { ...entity, id: entityNodeId(entity) };
}

export function buildEntityTree(
  entities: Entity[],
  childrenById: ReadonlyMap<string, Entity[]>,
): EntityNode[] {
  return entities.map((entity) => {
    const node = toEntityNode(entity);
    const children = childrenById.get(node.id);
    return children ? { ...node, children: buildEntityTree(children, childrenById) } : node;
  });
}

export function findEntityNode(nodes: EntityNode[], id: string): EntityNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findEntityNode(node.children ?? [], id);
    if (child) return child;
  }
  return undefined;
}

export function entityRefFromNode(node: EntityNode): EntityRef {
  return { name: node.name, index: node.index, generation: node.generation };
}

export function entityRefFromNodeId(id: string): EntityRef | undefined {
  const [indexText, generationText] = id.split(':');
  const index = Number(indexText);
  const generation = Number(generationText);
  return Number.isInteger(index) && Number.isInteger(generation)
    ? { name: '', index, generation }
    : undefined;
}
