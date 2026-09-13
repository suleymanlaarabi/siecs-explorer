import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  DataList,
  EmptyState,
  Heading,
  HStack,
  Separator,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { worldEditorSelectedEntityAtom } from "./atom";
import { useQuery } from "@tanstack/react-query";
import { useSchema } from "../../hooks/useSchema";
import {
  siecsClient,
  type EntityComponent,
  type EntityDetail,
  type EntityRef,
  type EntityRelation,
  type Schema,
} from "../../client";
import { EntityComponentEditor } from "./ComponentEditor";

export function EntityView() {
  const entity = useAtomValue(worldEditorSelectedEntityAtom);

  if (!entity) {
    return null;
  }

  return <EntityDetail entity={entity} />;
}

function EntityDetail({ entity }: { entity: EntityRef }) {
  const schemaQuery = useSchema();
  const { data, error, isLoading } = useQuery({
    queryKey: ["entity", entity.index, entity.generation],
    queryFn: () => siecsClient.entity(entity),
    refetchInterval: 1500,
  });

  if (isLoading) {
    return <EntityDetailShell entity={entity} loading />;
  }

  if (error) {
    return (
      <EntityDetailShell entity={entity}>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Title>Unable to load entity</EmptyState.Title>
            <EmptyState.Description>
              {error instanceof Error ? error.message : "Unknown error"}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      </EntityDetailShell>
    );
  }

  if (!data) {
    return null;
  }

  return <WithDataEntityDetail entity={data} schema={schemaQuery.data} />;
}

function WithDataEntityDetail({ entity, schema }: { entity: EntityDetail; schema?: Schema }) {
  return (
    <EntityDetailShell entity={entity}>
      <EntityRelations relations={entity.relations} schema={schema} />
      <EntityComponents entity={entity} schema={schema} components={entity.components} />
    </EntityDetailShell>
  );
}

function EntityDetailShell({
  entity,
  loading,
  children,
}: {
  entity: EntityRef;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  const hasChildren = "hasChildren" in entity ? entity.hasChildren === true : undefined;

  return (
    <Card.Root variant="outline" rounded="none" border="none" h="full">
      <Card.Body overflow="auto">
        <VStack align="stretch" gap="6">
          <HStack justify="space-between" align="start" gap="3">
            <VStack align="start" gap="1" minW="0">
              <Heading wordBreak="break-word">{entity.name}</Heading>
              <Text textStyle="sm" color="fg.muted">
                Entity #{entity.index}
              </Text>
            </VStack>

            {hasChildren !== undefined ? (
              <Badge variant="surface" colorPalette={hasChildren ? "green" : "gray"}>
                {hasChildren ? "Has children" : "Leaf"}
              </Badge>
            ) : null}
          </HStack>

          {loading ? (
            <VStack align="stretch" gap="3">
              <Skeleton height="8" />
              <Skeleton height="24" />
              <Skeleton height="32" />
            </VStack>
          ) : (
            children
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

function EntityRelations({ relations, schema }: { relations: EntityRelation[]; schema?: Schema }) {
  return (
    <Section title="Relations" aside={`${relations.length}`}>
      {relations.length > 0 ? (
        <VStack align="stretch" gap="3">
          {relations.map((relation) => (
            <RelationBlock key={relation.id} relation={relation} schema={schema} />
          ))}
        </VStack>
      ) : (
        <MutedValue>No relations</MutedValue>
      )}
    </Section>
  );
}

function RelationBlock({ relation, schema }: { relation: EntityRelation; schema?: Schema }) {
  const setSelectedEntity = useSetAtom(worldEditorSelectedEntityAtom);
  const definition = schema?.relations.find((item) => item.id === relation.id);

  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      <HStack justify="space-between" gap="3" px="3" py="2" bg="bg.subtle" borderBottomWidth="1px">
        <Text fontWeight="medium" wordBreak="break-word">
          {definition?.name ?? relation.name}
        </Text>
        <Badge variant="outline">#{relation.id}</Badge>
      </HStack>

      <HStack justify="space-between" gap="3" p="3">
        <VStack align="start" gap="0" minW="0">
          <Text wordBreak="break-word">{relation.target.name}</Text>
          <Text textStyle="sm" color="fg.muted">
            Entity #{relation.target.index}
          </Text>
        </VStack>

        <Button
          size="sm"
          variant="outline"
          flex="none"
          onClick={() => setSelectedEntity(relation.target)}
        >
          Open
        </Button>
      </HStack>
    </Box>
  );
}

function EntityComponents({
  entity,
  schema,
  components,
}: {
  entity: EntityDetail;
  schema?: Schema;
  components: EntityComponent[];
}) {
  return (
    <Section title="Components" aside={`${components.length}`}>
      {components.length > 0 ? (
        <VStack align="stretch" gap="3">
          {components.map((component) => (
            <ComponentBlock
              key={component.id}
              entity={entity}
              schema={schema}
              component={component}
            />
          ))}
        </VStack>
      ) : (
        <MutedValue>No components</MutedValue>
      )}
    </Section>
  );
}

function ComponentBlock({
  entity,
  schema,
  component,
}: {
  entity: EntityDetail;
  schema?: Schema;
  component: EntityComponent;
}) {
  const definition = schema?.components.find((item) => item.id === component.id);

  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      <HStack
        justify="space-between"
        gap="3"
        px="3"
        py="2"
        bg="bg.subtle"
        borderBottomWidth={definition || component.value != null ? "1px" : undefined}
      >
        <Text fontWeight="medium" wordBreak="break-word">
          {component.name}
        </Text>
        <Badge variant="outline">#{component.id}</Badge>
      </HStack>

      {definition ? (
        <Box p="3">
          <EntityComponentEditor
            entity={entity}
            component={definition}
            schema={schema!}
            entityComponent={component}
          />
        </Box>
      ) : component.value != null ? (
        <Box p="3">
          <ComponentValue value={component.value} />
        </Box>
      ) : null}
    </Box>
  );
}

function ComponentValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <MutedValue>{String(value)}</MutedValue>;
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant="surface" colorPalette={value ? "green" : "red"}>
        {String(value)}
      </Badge>
    );
  }

  if (typeof value === "number") {
    return <Code variant="subtle">{value}</Code>;
  }

  if (typeof value === "string") {
    return (
      <Text whiteSpace="pre-wrap" wordBreak="break-word">
        {value || <MutedValue>Empty string</MutedValue>}
      </Text>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <MutedValue>Empty list</MutedValue>;
    }

    return (
      <VStack align="stretch" gap="2">
        {value.map((item, index) => (
          <HStack key={index} align="start" gap="3">
            <Badge variant="surface" colorPalette="gray" minW="8" justifyContent="center">
              {index}
            </Badge>
            <Box flex="1" minW="0">
              <ComponentValue value={item} />
            </Box>
          </HStack>
        ))}
      </VStack>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return <MutedValue>Empty object</MutedValue>;
    }

    return (
      <DataList.Root orientation="horizontal">
        {entries.map(([key, fieldValue]) => (
          <DataList.Item key={key}>
            <DataList.ItemLabel color="fg.muted" wordBreak="break-word">
              {key}
            </DataList.ItemLabel>
            <DataList.ItemValue display={"flex"} justifyContent={"flex-end"}>
              <ComponentValue value={fieldValue} />
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    );
  }

  return <Code variant="subtle">{String(value)}</Code>;
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="3">
      <HStack justify="space-between">
        <Heading>{title}</Heading>
        {aside ? <Badge variant="surface">{aside}</Badge> : null}
      </HStack>
      <Separator />
      {children}
    </Stack>
  );
}

function MutedValue({ children }: { children: React.ReactNode }) {
  return (
    <Text as="span" color="fg.muted">
      {children}
    </Text>
  );
}
