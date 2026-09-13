import { Badge, Box, Card, Heading, HStack, Separator, Text, VStack } from '@chakra-ui/react';
import type { EntityDetail, Schema } from '../../../client';
import { EntityComponentsSection } from './EntityComponentsSection';
import { EntityRelationsSection } from './EntityRelationsSection';

export function EntityInspector({
  entity,
  schema,
}: {
  entity: EntityDetail;
  schema?: Schema | undefined;
}) {
  return (
    <Card.Root variant="outline" rounded="none" border="none" h="full">
      <Card.Header px="4" py="3" borderBottomWidth="1px">
        <HStack justify="space-between" align="start" gap="3">
          <Box minW="0">
            <Heading size="md" truncate>
              {entity.name || 'Unnamed entity'}
            </Heading>
            <Text textStyle="xs" color="fg.muted">
              Entity inspector
            </Text>
          </Box>
          <Badge variant="surface" flex="none">
            #{entity.index}
          </Badge>
        </HStack>
      </Card.Header>
      <Card.Body px="4" py="3" overflowY="auto">
        <VStack align="stretch" gap="5">
          <EntityComponentsSection entity={entity} schema={schema} />
          <Separator />
          <EntityRelationsSection entity={entity} schema={schema} />
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
