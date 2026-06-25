import { useAtomValue } from "jotai";
import { worldEditorSelectedComponentAtom } from "./atom";
import type { Schema } from "../../client";
import { Badge, Card, Heading, HStack, Text, VStack } from "@chakra-ui/react";

type ComponentInspectorProps = {
  schema: Schema;
  componentId: number;
};

export function ComponentInspector({
  schema,
  componentId,
}: ComponentInspectorProps) {
  const component = schema.components.find((c) => c.id === componentId)!;

  const typeById = new Map(schema.types.map((type) => [type.id, type]));

  return (
    <Card.Root variant="outline" rounded={"none"} border={"none"} h={"full"}>
      <Card.Body>
        <VStack align="stretch" gap="6">
          <HStack justify="space-between">
            <Heading size="md">{component.name}</Heading>

            <Badge variant="surface">
              {component.isRelation ? "Relation" : "Component"}
            </Badge>
          </HStack>

          <VStack align="stretch" gap="1">
            <Text textStyle="xs" color="fg.muted">
              Fields
            </Text>

            {component.fields.map((field) => (
              <HStack key={field.name} py="2">
                <Text flex="1">{field.name}</Text>

                <Text color="fg.muted">{typeById.get(field.type)?.name}</Text>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export function ComponentView() {
  const selectedComponent = useAtomValue(worldEditorSelectedComponentAtom);

  if (!selectedComponent) {
    return null;
  }

  return (
    <ComponentInspector
      schema={selectedComponent.schema}
      componentId={selectedComponent.component.id}
    />
  );
}
