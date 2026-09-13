import {
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  Code,
  Dialog,
  EmptyState,
  Heading,
  HStack,
  IconButton,
  Menu,
  Portal,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useSetAtom } from "jotai";
import { EllipsisVertical, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import type { EntityComponent, EntityDetail, EntityRelation, Schema } from "../../../client";
import { AddComponentDialog } from "../AddComponentDialog";
import { AddRelationDialog } from "../AddRelationDialog";
import { EntityComponentEditor } from "../ComponentEditor";
import { EntityPicker } from "../EntityPicker";
import { worldEditorSelectedEntityAtom } from "../atom";
import { hasComponentData } from "../entityOptions";
import { useRemoveComponent, useRemoveRelation, useSetRelation } from "../hooks/useEntityMutations";

export function EntityInspector({ entity, schema }: { entity: EntityDetail; schema?: Schema }) {
  return (
    <Card.Root variant="outline" rounded="none" border="none" h="full">
      <Card.Header px="4" py="3" borderBottomWidth="1px">
        <HStack justify="space-between" align="start" gap="3">
          <Box minW="0">
            <Heading size="md" truncate>
              {entity.name || "Unnamed entity"}
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

function EntityComponentsSection({ entity, schema }: { entity: EntityDetail; schema?: Schema }) {
  return (
    <SectionHeader
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
    </SectionHeader>
  );
}

function EntityComponentCard({
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
        <DestructiveAction
          subject={`component ${definition?.name ?? component.name}`}
          title={`Remove ${definition?.name ?? component.name}?`}
          description={`This component and its current value will be removed from Entity #${entity.index}.`}
          pending={remove.isPending}
          onConfirm={() => remove.mutateAsync(component.id)}
        />
      </HStack>
      {hasComponentData(component.value) ? (
        <Box px="3" py="2" borderTopWidth="1px">
          {definition && schema ? (
            <EntityComponentEditor
              entity={entity}
              component={definition}
              schema={schema}
              entityComponent={component}
            />
          ) : (
            <ComponentValue value={component.value} />
          )}
        </Box>
      ) : null}
    </Box>
  );
}

function EntityRelationsSection({ entity, schema }: { entity: EntityDetail; schema?: Schema }) {
  return (
    <SectionHeader
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
    >
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
    </SectionHeader>
  );
}

function EntityRelationCard({
  entity,
  schema,
  relation,
}: {
  entity: EntityDetail;
  schema?: Schema;
  relation: EntityRelation;
}) {
  const setSelectedEntity = useSetAtom(worldEditorSelectedEntityAtom);
  const setRelation = useSetRelation(entity);
  const remove = useRemoveRelation(entity);
  const definition = schema?.relations.find((item) => item.id === relation.id);

  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      <HStack justify="space-between" gap="2" minH="8" px="3" py="1" bg="bg.subtle">
        <HStack gap="2" minW="0">
          <Text textStyle="sm" fontWeight="medium" truncate>
            {definition?.name ?? relation.name}
          </Text>
          {definition?.acyclic ? <Badge size="sm">Acyclic</Badge> : null}
        </HStack>
        <DestructiveAction
          subject={`relation ${definition?.name ?? relation.name}`}
          title={`Remove ${definition?.name ?? relation.name}?`}
          description={`This relation will be removed from Entity #${entity.index}.`}
          pending={remove.isPending || setRelation.isPending}
          onConfirm={() => remove.mutateAsync(relation.id)}
        />
      </HStack>
      <VStack align="stretch" gap="1" px="3" py="2" borderTopWidth="1px">
        <Text textStyle="xs" color="fg.muted">
          Target
        </Text>
        <HStack gap="2">
          <Box flex="1" minW="0">
            <EntityPicker
              value={relation.target}
              disabled={setRelation.isPending || remove.isPending}
              label={`Change target for ${definition?.name ?? relation.name}`}
              onChange={(target) => {
                if (
                  target.index !== relation.target.index ||
                  target.generation !== relation.target.generation
                ) {
                  setRelation.mutate({ relationId: relation.id, target });
                }
              }}
            />
          </Box>
          <IconButton
            size="sm"
            variant="outline"
            flex="none"
            aria-label={`Open ${relation.target.name || `Entity ${relation.target.index}`}`}
            onClick={() => setSelectedEntity(relation.target)}
          >
            <ExternalLink size={14} aria-hidden="true" />
          </IconButton>
        </HStack>
        {setRelation.isPending ? (
          <HStack gap="1" color="fg.muted">
            <Spinner size="xs" />
            <Text textStyle="xs">Changing target…</Text>
          </HStack>
        ) : null}
      </VStack>
    </Box>
  );
}

function DestructiveAction({
  subject,
  title,
  description,
  pending,
  onConfirm,
}: {
  subject: string;
  title: string;
  description: string;
  pending: boolean;
  onConfirm: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={`Actions for ${subject}`}
            disabled={pending}
          >
            <EllipsisVertical size={14} aria-hidden="true" />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="remove" color="fg.error" onClick={() => setOpen(true)}>
                <Trash2 size={14} aria-hidden="true" />
                Remove {subject.startsWith("component") ? "component" : "relation"}
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <Dialog.Root open={open} onOpenChange={(details) => !pending && setOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="sm">
              <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text color="fg.muted">{description}</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  loading={pending}
                  onClick={async () => {
                    try {
                      await onConfirm();
                      setOpen(false);
                    } catch {
                      // The centralized mutation handler keeps the confirmation open and reports the error.
                    }
                  }}
                >
                  Remove
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" disabled={pending} />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

function SectionHeader({
  title,
  action,
  children,
}: {
  title: string;
  action: React.ReactNode;
  children: React.ReactNode;
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

function EmptyValue({ children }: { children: React.ReactNode }) {
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

function ComponentValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <Text color="fg.muted">{String(value)}</Text>;
  }
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
  let serialized: string;
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
