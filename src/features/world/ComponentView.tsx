import { useAtomValue } from 'jotai';
import { worldSelectionAtom } from './model/worldEditorState';
import type { Schema } from '../../lib/siecs/types';
import { useSchemaQuery } from './api/schemaQueries';
import { Card, Heading, HStack, Text, VStack } from '@chakra-ui/react';

type ComponentInspectorProps = {
  schema: Schema;
  componentId: number;
};

export function ComponentInspector({ schema, componentId }: ComponentInspectorProps) {
  const component = schema.components.find((item) => item.id === componentId);
  if (!component) return null;

  const typeById = new Map(schema.types.map((type) => [type.id, type]));

  return (
    <Card.Root variant="outline" rounded={'none'} border={'none'} h={'full'}>
      <Card.Body>
        <VStack align="stretch" gap="6">
          <HStack justify="space-between">
            <Heading size="md">{component.name}</Heading>
          </HStack>

          {component.fields.length > 0 ? (
            <VStack align="stretch" gap="1">
              <Text color="fg.muted">Fields</Text>
              {component.fields.map((field) => (
                <HStack key={field.name} py="2">
                  <Text flex="1">{field.name}</Text>

                  <Text color="fg.muted">{typeById.get(field.type)?.name}</Text>
                </HStack>
              ))}
            </VStack>
          ) : null}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export function ComponentView() {
  const selection = useAtomValue(worldSelectionAtom);
  const { data: schema } = useSchemaQuery();

  if (selection?.type !== 'component' || !schema) {
    return null;
  }

  return <ComponentInspector schema={schema} componentId={selection.id} />;
}
