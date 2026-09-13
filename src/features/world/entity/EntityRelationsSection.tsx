import { Button, EmptyState, Heading, HStack, VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { EntityDetail, Schema } from '../../../client';
import { AddRelationDialog } from '../AddRelationDialog';
import { EntityRelationCard } from './EntityRelationCard';

export function EntityRelationsSection({
  entity,
  schema,
}: {
  entity: EntityDetail;
  schema?: Schema | undefined;
}) {
  return (
    <VStack align="stretch" gap="2">
      <HStack justify="space-between" minH="7">
        <Heading size="sm">Relations</Heading>
        {schema ? (
          <AddRelationDialog entity={entity} schema={schema} />
        ) : (
          <Button size="xs" variant="ghost" disabled>
            Add
          </Button>
        )}
      </HStack>
      {entity.relations.length > 0 ? (
        <VStack align="stretch" gap="2">
          {entity.relations.map((relation) => (
            <EntityRelationCard
              key={relation.id}
              entity={entity}
              schema={schema}
              relation={relation}
            />
          ))}
        </VStack>
      ) : (
        <EmptyValue>No relations</EmptyValue>
      )}
    </VStack>
  );
}

function EmptyValue({ children }: { children: ReactNode }) {
  return (
    <EmptyState.Root size="sm" py="4">
      <EmptyState.Content>
        <EmptyState.Title color="fg.muted" textStyle="sm">
          {children}
        </EmptyState.Title>
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
