import { Card, EmptyState, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { siecsClient, type EntityRef } from "../../client";
import { useSchema } from "../../hooks/useSchema";
import { worldEditorSelectedEntityAtom } from "./atom";
import { EntityInspector } from "./entity/EntityInspector";
import { useIsEntityMutating } from "./hooks/useEntityMutations";

export function EntityView() {
  const entity = useAtomValue(worldEditorSelectedEntityAtom);
  return entity ? <EntityDetail entity={entity} /> : null;
}

function EntityDetail({ entity }: { entity: EntityRef }) {
  const schemaQuery = useSchema();
  const mutationPending = useIsEntityMutating(entity);
  const { data, error, isLoading } = useQuery({
    queryKey: ["entity", entity.index, entity.generation],
    queryFn: () => siecsClient.entity(entity),
    refetchInterval: mutationPending ? false : 1500,
  });

  if (isLoading) return <EntityDetailShell entity={entity} loading />;

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

  return data ? (
    <EntityInspector
      key={`${data.index}:${data.generation}`}
      entity={data}
      schema={schemaQuery.data}
    />
  ) : null;
}

function EntityDetailShell({
  entity,
  loading,
  children,
}: {
  entity: EntityRef;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card.Root variant="outline" rounded="none" border="none" h="full">
      <Card.Header px="4" py="3" borderBottomWidth="1px">
        <HStack justify="space-between">
          <VStack align="start" gap="0">
            <Heading size="md">{entity.name || "Unnamed entity"}</Heading>
            <Text textStyle="xs" color="fg.muted">
              Entity #{entity.index}
            </Text>
          </VStack>
        </HStack>
      </Card.Header>
      <Card.Body overflow="auto" px="4" py="3">
        {loading ? (
          <VStack align="stretch" gap="3">
            <Skeleton height="8" />
            <Skeleton height="24" />
            <Skeleton height="24" />
          </VStack>
        ) : (
          children
        )}
      </Card.Body>
    </Card.Root>
  );
}
