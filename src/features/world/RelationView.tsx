import { useAtomValue } from 'jotai';
import { worldSelectionAtom } from './model/worldEditorState';
import type { Schema } from '../../lib/siecs/types';
import { useSchemaQuery } from './api/schemaQueries';
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
  const selection = useAtomValue(worldSelectionAtom);
  const { data: schema } = useSchemaQuery();

  if (selection?.type !== 'relation' || !schema) {
    return null;
  }

  return <RelationInspector schema={schema} relationId={selection.id} />;
}
