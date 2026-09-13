import { useAtomValue } from 'jotai';
import { worldEditorSelectedRelationAtom } from './atom';
import type { Schema } from '../../client';
import { Card, Heading, HStack, VStack } from '@chakra-ui/react';
import { Badge } from '@chakra-ui/react/badge';

type RelationInspectorProps = {
  schema: Schema;
  relationId: number;
};

export function RelationInspector({ schema, relationId }: RelationInspectorProps) {
  const relation = schema.relations.find((item) => item.id === relationId);
  if (!relation) return null;

  return (
    <Card.Root variant="outline" rounded={'none'} border={'none'} h={'full'}>
      <Card.Body>
        <VStack align="stretch" gap="6">
          <HStack justify="space-between">
            <Heading size="md">{relation.name}</Heading>
          </HStack>
          <HStack>
            {relation.acyclic ? <Badge>Acyclic</Badge> : null}
            <Badge>
              {relation.storage === 0 ? 'Dense' : relation.storage === 1 ? 'Depth' : 'Target'}
            </Badge>
            {relation.onDeleteTarget === 1 ? <Badge>Linked Spawn</Badge> : null}
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export function RelationView() {
  const selectedRelation = useAtomValue(worldEditorSelectedRelationAtom);

  if (!selectedRelation) {
    return null;
  }

  return (
    <RelationInspector schema={selectedRelation.schema} relationId={selectedRelation.relation.id} />
  );
}
