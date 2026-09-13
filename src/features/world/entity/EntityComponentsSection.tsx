import { Button, EmptyState, Heading, HStack, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { EntityDetail, Schema } from "../../../client";
import { AddComponentDialog } from "../AddComponentDialog";
import { EntityComponentCard } from "./EntityComponentCard";

export function EntityComponentsSection({
  entity,
  schema,
}: {
  entity: EntityDetail;
  schema?: Schema;
}) {
  return (
    <Section
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
      {entity.components.length > 0 ? (
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
      ) : (
        <EmptyValue>No components</EmptyValue>
      )}
    </Section>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <VStack align="stretch" gap="2">
      <HStack justify="space-between" minH="7">
        <Heading size="sm">{title}</Heading>
        {action}
      </HStack>
      {children}
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
