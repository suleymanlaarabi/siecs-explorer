import { Button, VStack } from '@chakra-ui/react';
import type { EntityDetail, Schema } from '../../../lib/siecs/types';
import { InspectorSection } from '../../../shared/components/InspectorSection';
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
    <InspectorSection
      title="Relations"
      action={
        schema ? (
          <AddRelationDialog entity={entity} schema={schema} />
        ) : (
          <Button size="xs" variant="ghost" disabled>
            Add
          </Button>
        )
      }
      empty={entity.relations.length === 0}
      emptyText="No relations"
    >
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
    </InspectorSection>
  );
}
