import { createListCollection, Listbox } from '@chakra-ui/react';
import { useMemo } from 'react';

type Definition = { id: number; name: string };

export function DefinitionList<T extends Definition>({
  items,
  onSelect,
}: {
  items: T[];
  onSelect: (item: T | undefined) => void;
}) {
  const collection = useMemo(
    () => createListCollection({ itemToValue: (item) => item.id.toString(), items }),
    [items],
  );

  return (
    <Listbox.Root
      collection={collection}
      width="full"
      height="full"
      onValueChange={(details) => onSelect(details.items[0])}
    >
      <Listbox.Content rounded="none" border="none" height="full" maxH="none">
        {collection.items.map((item) => (
          <Listbox.Item
            item={item}
            key={item.id}
            flex="none"
            rounded="xs"
            _hover={{ bg: 'bg.emphasized/60' }}
            _selected={{ bg: 'bg.muted' }}
          >
            <Listbox.ItemText fontSize="md">{item.name}</Listbox.ItemText>
          </Listbox.Item>
        ))}
      </Listbox.Content>
    </Listbox.Root>
  );
}
