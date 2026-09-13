import {
  Badge,
  Button,
  CloseButton,
  createListCollection,
  Dialog,
  Field,
  HStack,
  Input,
  InputGroup,
  Listbox,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { EntityDetail, EntityRef, Schema } from "../../client";
import { EntityPicker } from "./EntityPicker";
import { getAddableRelations } from "./entityOptions";
import { useSetRelation } from "./hooks/useEntityMutations";

export function AddRelationDialog({ entity, schema }: { entity: EntityDetail; schema: Schema }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number>();
  const [target, setTarget] = useState<EntityRef>();
  const mutation = useSetRelation(entity);
  const available = getAddableRelations(schema.relations, entity.relations, search);
  const collection = useMemo(
    () =>
      createListCollection({
        items: available,
        itemToString: (relation) => relation.name,
        itemToValue: (relation) => String(relation.id),
      }),
    [available],
  );

  const reset = () => {
    setSearch("");
    setSelectedId(undefined);
    setTarget(undefined);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <Button size="xs" variant="ghost" aria-label="Add relation">
          <Plus size={14} aria-hidden="true" />
          Add
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>Add relation</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap="4">
                <VStack align="stretch" gap="2">
                  <Text textStyle="sm" fontWeight="medium">
                    Relation
                  </Text>
                  <InputGroup startElement={<Search size={14} />}>
                    <Input
                      autoFocus
                      placeholder="Search components..."
                      aria-label="Search components"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </InputGroup>
                  <Listbox.Root
                    collection={collection}
                    value={selectedId === undefined ? [] : [String(selectedId)]}
                    onValueChange={(details) => setSelectedId(details.items[0]?.id)}
                  >
                    <Listbox.Content border="none" p="0" maxH="40" overflowY="auto">
                      {available.length === 0 ? (
                        <Listbox.Empty color="fg.muted" textStyle="sm" p="2">
                          No relations available
                        </Listbox.Empty>
                      ) : (
                        collection.items.map((relation) => (
                          <Listbox.Item
                            key={relation.id}
                            item={relation}
                            minH="8"
                            px="2"
                            rounded="sm"
                            _hover={{ bg: "bg.subtle" }}
                            _selected={{ bg: "bg.muted" }}
                          >
                            <Listbox.ItemText truncate>{relation.name}</Listbox.ItemText>
                            <HStack gap="1">
                              {relation.acyclic ? <Badge>Acyclic</Badge> : null}
                              <Badge variant="outline">#{relation.id}</Badge>
                            </HStack>
                          </Listbox.Item>
                        ))
                      )}
                    </Listbox.Content>
                  </Listbox.Root>
                </VStack>
                <Field.Root disabled={selectedId === undefined}>
                  <Field.Label>Target</Field.Label>
                  <EntityPicker
                    value={target}
                    onChange={setTarget}
                    disabled={selectedId === undefined || mutation.isPending}
                    label="Search entity..."
                  />
                </Field.Root>
                {target ? (
                  <Text textStyle="sm" color="fg.muted">
                    Selected: {target.name || "Entity"} #{target.index}
                  </Text>
                ) : null}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="blue"
                loading={mutation.isPending}
                disabled={selectedId === undefined || !target}
                onClick={async () => {
                  if (selectedId === undefined || !target) return;
                  try {
                    await mutation.mutateAsync({ relationId: selectedId, target, isNew: true });
                    setOpen(false);
                    reset();
                  } catch {
                    // The centralized mutation handler keeps the dialog open and reports the error.
                  }
                }}
              >
                Add
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" disabled={mutation.isPending} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
