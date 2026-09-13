import {
  Button,
  createListCollection,
  HStack,
  Input,
  InputGroup,
  Listbox,
  Popover,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { EntityLike, EntityRef } from "../../client";
import { useEntities } from "../../hooks/useEntities";

export function EntityPicker({
  value,
  onChange,
  disabled,
  label = "Select entity",
}: {
  value?: EntityLike;
  onChange: (entity: EntityRef) => void;
  disabled?: boolean;
  label?: string;
}) {
  const entitiesQuery = useEntities();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected =
    typeof value === "object"
      ? value
      : entitiesQuery.data?.find((entity) => entity.index === value);
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase().replace(/^#/, "");
    if (!normalized) return entitiesQuery.data ?? [];
    return (entitiesQuery.data ?? []).filter(
      (entity) =>
        entity.name.toLowerCase().includes(normalized) || String(entity.index).includes(normalized),
    );
  }, [entitiesQuery.data, search]);
  const collection = useMemo(
    () =>
      createListCollection({
        items: filtered,
        itemToString: (entity) => entity.name || `Entity ${entity.index}`,
        itemToValue: (entity) => `${entity.index}:${entity.generation}`,
      }),
    [filtered],
  );

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) setSearch("");
      }}
      positioning={{ placement: "bottom-start", sameWidth: true }}
    >
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          w="full"
          justifyContent="space-between"
          disabled={disabled}
          aria-label={label}
        >
          <Text truncate>
            {selected
              ? `${selected.name || "Entity"} #${selected.index}`
              : typeof value === "number"
                ? `Entity #${value}`
                : label}
          </Text>
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="sm">
            <Popover.Body p="2">
              <Listbox.Root
                collection={collection}
                value={selected ? [`${selected.index}:${selected.generation}`] : []}
                onValueChange={(details) => {
                  const entity = details.items[0];
                  if (entity) {
                    onChange(entity);
                    setOpen(false);
                  }
                }}
              >
                <InputGroup startElement={<Search size={14} />}>
                  <Input
                    autoFocus
                    placeholder="Search components..."
                    aria-label="Search components"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </InputGroup>
                <Listbox.Content border="none" p="0" maxH="56" overflowY="auto">
                  {entitiesQuery.isLoading ? (
                    <HStack justify="center" py="4">
                      <Spinner size="sm" />
                      <Text textStyle="sm" color="fg.muted">
                        Loading entities…
                      </Text>
                    </HStack>
                  ) : entitiesQuery.error ? (
                    <Text textStyle="sm" color="fg.error" p="2">
                      Unable to load entities
                    </Text>
                  ) : filtered.length === 0 ? (
                    <Listbox.Empty textStyle="sm" color="fg.muted" p="2">
                      No entities found
                    </Listbox.Empty>
                  ) : (
                    collection.items.map((entity) => (
                      <Listbox.Item
                        key={`${entity.index}:${entity.generation}`}
                        item={entity}
                        minH="8"
                        px="2"
                        rounded="sm"
                        _hover={{ bg: "bg.subtle" }}
                        _selected={{ bg: "bg.muted" }}
                      >
                        <HStack justify="space-between" w="full">
                          <Listbox.ItemText truncate>
                            {entity.name || "Unnamed entity"}
                          </Listbox.ItemText>
                          <Text color="fg.muted">#{entity.index}</Text>
                        </HStack>
                      </Listbox.Item>
                    ))
                  )}
                </Listbox.Content>
              </Listbox.Root>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
