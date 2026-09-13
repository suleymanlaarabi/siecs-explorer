import {
  Badge,
  Box,
  Button,
  CloseButton,
  createListCollection,
  Dialog,
  HStack,
  Input,
  Listbox,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { EntityDetail, Schema } from "../../client";
import { getAddableComponents } from "./entityOptions";
import { useAddComponent } from "./hooks/useEntityMutations";
import { InputGroup } from "@chakra-ui/react/input-group";

export function AddComponentDialog({
  entity,
  schema,
}: {
  entity: EntityDetail;
  schema: Schema;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number>();
  const mutation = useAddComponent(entity);
  const available = getAddableComponents(
    schema.components,
    entity.components,
    search,
  );
  const collection = useMemo(
    () =>
      createListCollection({
        items: available,
        itemToString: (component) => component.name,
        itemToValue: (component) => String(component.id),
      }),
    [available],
  );
  const selected = schema.components.find(
    (component) => component.id === selectedId,
  );
  const typeById = new Map(schema.types.map((type) => [type.id, type]));

  const reset = () => {
    setSearch("");
    setSelectedId(undefined);
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
        <Button size="xs" variant="ghost" aria-label="Add component">
          <Plus size={14} aria-hidden="true" />
          Add
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>Add component</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap="3">
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
                  onValueChange={(details) =>
                    setSelectedId(details.items[0]?.id)
                  }
                >
                  <Listbox.Content
                    border="none"
                    p="0"
                    maxH="52"
                    overflowY="auto"
                  >
                    {available.length === 0 ? (
                      <Listbox.Empty color="fg.muted" textStyle="sm" p="2">
                        No components available
                      </Listbox.Empty>
                    ) : (
                      collection.items.map((component) => (
                        <Listbox.Item
                          key={component.id}
                          item={component}
                          minH="8"
                          px="2"
                          rounded="sm"
                          _hover={{ bg: "bg.subtle" }}
                          _selected={{ bg: "bg.muted" }}
                        >
                          <Listbox.ItemText truncate>
                            {component.name}
                          </Listbox.ItemText>
                          <Badge variant="outline">#{component.id}</Badge>
                        </Listbox.Item>
                      ))
                    )}
                  </Listbox.Content>
                </Listbox.Root>
                {selected ? (
                  <Box borderWidth="1px" rounded="sm" p="3">
                    <Text fontWeight="medium" mb="2">
                      {selected.name}
                    </Text>
                    <VStack align="stretch" gap="1">
                      {selected.fields.length > 0 ? (
                        selected.fields.map((field) => (
                          <HStack
                            key={field.name}
                            justify="space-between"
                            textStyle="sm"
                          >
                            <Text>{field.name}</Text>
                            <Text color="fg.muted">
                              {typeById.get(field.type)?.name ?? "Unknown"}
                            </Text>
                          </HStack>
                        ))
                      ) : (
                        <Text textStyle="sm" color="fg.muted">
                          Default value will be used
                        </Text>
                      )}
                    </VStack>
                  </Box>
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
                disabled={selectedId === undefined}
                onClick={async () => {
                  if (selectedId === undefined) return;
                  try {
                    await mutation.mutateAsync({ componentId: selectedId });
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
