import {
  Badge,
  Box,
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
import { useAtomValue } from "jotai";
import { worldEditorSelectedEntityAtom } from "./atom";
import { useQuery } from "@tanstack/react-query";
import {
  siecsClient,
  type Entity,
  type EntityComponent,
  type EntityDetail as EntityDetailType,
} from "../../client";

export function EntityView() {
  const entity = useAtomValue(worldEditorSelectedEntityAtom);

  if (!entity) {
    return null;
  }

  return <EntityDetail entity={entity} />;
}

function EntityDetail({ entity }: { entity: Entity }) {
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

  return (
    <EntityDetailShell entity={data}>
      <VStack align="stretch" gap="6">
        <EntityMetadata entity={data} />
        <EntityComponents components={data.components} />
      </VStack>
    </EntityDetailShell>
  );
}

function EntityDetailShell({
  entity,
  loading,
  children,
}: {
  entity: Entity;
  loading?: boolean;
  children?: React.ReactNode;
}) {
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

            <Badge
              variant="surface"
              colorPalette={entity.hasChildren ? "green" : "gray"}
            >
              {entity.hasChildren ? "Has children" : "Leaf"}
            </Badge>
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

function EntityMetadata({ entity }: { entity: EntityDetailType }) {
  return (
    <Section title="Details">
      <DataList.Root orientation="horizontal">
        <DataList.Item>
          <DataList.ItemLabel>Generation</DataList.ItemLabel>
          <DataList.ItemValue>{entity.generation}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>Children</DataList.ItemLabel>
          <DataList.ItemValue>{entity.children.length}</DataList.ItemValue>
        </DataList.Item>
      </DataList.Root>
    </Section>
  );
}

function EntityComponents({ components }: { components: EntityComponent[] }) {
  return (
    <Section title="Components" aside={`${components.length}`}>
      {components.length > 0 ? (
        <VStack align="stretch" gap="3">
          {components.map((component) => (
            <ComponentBlock key={component.id} component={component} />
          ))}
        </VStack>
      ) : (
        <MutedValue>No components</MutedValue>
      )}
    </Section>
  );
}

function ComponentBlock({ component }: { component: EntityComponent }) {
  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      <HStack
        justify="space-between"
        gap="3"
        px="3"
        py="2"
        bg="bg.subtle"
        borderBottomWidth="1px"
      >
        <Text fontWeight="medium" wordBreak="break-word">
          {component.name}
        </Text>
        <Badge variant="outline">#{component.id}</Badge>
      </HStack>

      <Box p="3">
        <ComponentValue value={component.value} />
      </Box>
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
            <Badge
              variant="surface"
              colorPalette="gray"
              minW="8"
              justifyContent="center"
            >
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
