import { Badge, Box, Code, HStack, Text } from "@chakra-ui/react";
import type { EntityComponent, EntityDetail, Schema } from "../../../client";
import { ConfirmDeleteAction } from "../../../components/ConfirmDeleteAction";
import { EntityComponentEditor } from "../components/EntityComponentEditor";
import { useRemoveComponent } from "../hooks/useEntityMutations";

export function EntityComponentCard({
  entity,
  schema,
  component,
}: {
  entity: EntityDetail;
  schema?: Schema;
  component: EntityComponent;
}) {
  const definition = schema?.components.find((item) => item.id === component.id);
  const remove = useRemoveComponent(entity);
  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      <HStack justify="space-between" gap="2" minH="8" px="3" py="1" bg="bg.subtle">
        <HStack gap="2" minW="0">
          <Text textStyle="sm" fontWeight="medium" truncate>
            {definition?.name ?? component.name}
          </Text>
          <Text textStyle="xs" color="fg.muted">
            #{component.id}
          </Text>
        </HStack>
        <ConfirmDeleteAction
          subject={`component ${definition?.name ?? component.name}`}
          title={`Remove ${definition?.name ?? component.name}?`}
          description={`This component and its current value will be removed from Entity #${entity.index}.`}
          pending={remove.isPending}
          onConfirm={() => remove.mutateAsync(component.id)}
        />
      </HStack>
      {definition?.fields.length && schema ? (
        <Box px="3" py="2" borderTopWidth="1px">
          <EntityComponentEditor
            entity={entity}
            component={definition}
            schema={schema}
            entityComponent={component}
          />
        </Box>
      ) : component.value != null ? (
        <Box px="3" py="2" borderTopWidth="1px">
          <ComponentValue value={component.value} />
        </Box>
      ) : null}
    </Box>
  );
}

function ComponentValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return (
      <Badge variant="surface" colorPalette={value ? "green" : "red"}>
        {String(value)}
      </Badge>
    );
  }
  if (typeof value === "string")
    return <Text whiteSpace="pre-wrap">{value || "Empty string"}</Text>;
  if (typeof value === "number") return <Code>{value}</Code>;
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value, null, 2);
  } catch {
    return <Text color="fg.muted">Unsupported value</Text>;
  }
  return (
    <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
      {serialized}
    </Code>
  );
}
