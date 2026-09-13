import {
  createListCollection,
  HStack,
  Input,
  InputGroup,
  Listbox,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

export function SearchableListbox<T>({
  items,
  value,
  searchPlaceholder,
  getKey,
  getLabel,
  filter,
  renderItem,
  onChange,
  emptyText = 'No items found',
  isLoading,
  error,
}: {
  items: T[];
  value: T | undefined;
  searchPlaceholder: string;
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  filter?: (item: T, normalizedSearch: string) => boolean;
  renderItem?: (item: T) => ReactNode;
  onChange: (item: T | undefined) => void;
  emptyText?: string;
  isLoading?: boolean;
  error?: string | undefined;
}) {
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase().replace(/^#/, '');
  const filtered = useMemo(
    () =>
      filter
        ? items.filter((item) => filter(item, normalizedSearch))
        : items.filter((item) => getLabel(item).toLowerCase().includes(normalizedSearch)),
    [filter, getLabel, items, normalizedSearch],
  );
  const collection = useMemo(
    () =>
      createListCollection({
        items: filtered,
        itemToString: getLabel,
        itemToValue: (item) => String(getKey(item)),
      }),
    [filtered, getKey, getLabel],
  );

  return (
    <Listbox.Root
      collection={collection}
      value={value ? [String(getKey(value))] : []}
      onValueChange={(details) => {
        const key = details.value[0];
        onChange(filtered.find((item) => String(getKey(item)) === key));
      }}
    >
      <InputGroup startElement={<Search size={14} />}>
        <Input
          autoFocus
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </InputGroup>
      <Listbox.Content border="none" p="0" maxH="56" overflowY="auto">
        {isLoading ? (
          <HStack justify="center" py="4">
            <Spinner size="sm" />
            <Text textStyle="sm" color="fg.muted">
              Loading…
            </Text>
          </HStack>
        ) : error ? (
          <Text textStyle="sm" color="fg.error" p="2">
            {error}
          </Text>
        ) : filtered.length === 0 ? (
          <Listbox.Empty textStyle="sm" color="fg.muted" p="2">
            {emptyText}
          </Listbox.Empty>
        ) : (
          collection.items.map((item) => (
            <Listbox.Item
              key={getKey(item)}
              item={item}
              minH="8"
              px="2"
              rounded="sm"
              _hover={{ bg: 'bg.subtle' }}
              _selected={{ bg: 'bg.muted' }}
            >
              {renderItem ? (
                renderItem(item)
              ) : (
                <Listbox.ItemText truncate>{getLabel(item)}</Listbox.ItemText>
              )}
            </Listbox.Item>
          ))
        )}
      </Listbox.Content>
    </Listbox.Root>
  );
}
