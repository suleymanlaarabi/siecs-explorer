import { Button, VStack } from '@chakra-ui/react';
import type { EntityDetail, Schema } from '../../../lib/siecs/types';
import { InspectorSection } from '../../../shared/components/InspectorSection';
import { AddComponentDialog } from '../AddComponentDialog';
import { EntityComponentCard } from './EntityComponentCard';

export function EntityComponentsSection({
  entity,
  schema,
}: {
  entity: EntityDetail;
  schema?: Schema | undefined;
}) {
  return (
    <InspectorSection
      title="Components"
      action={
        schema ? (
          <AddComponentDialog entity={entity} schema={schema} />
        ) : (
          <Button size="xs" variant="ghost" disabled>
            Add
          </Button>
        )
      }
    >
      <VStack align="stretch" gap="2">
        {entity.components.map((component) => (
          <EntityComponentCard
            key={component.id}
            entity={entity}
            schema={schema}
            component={component}
          />
        ))}
      </VStack>
    </InspectorSection>
  );
}
