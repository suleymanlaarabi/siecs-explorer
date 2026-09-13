import { createListCollection, Listbox } from '@chakra-ui/react';
import { useSchema } from '../../hooks/useSchema';
import { useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { worldEditorSelectedComponentAtom } from './atom';

export function ComponentList() {
  const { data } = useSchema();

  const setSelectedComponent = useSetAtom(worldEditorSelectedComponentAtom);

  const collections = useMemo(
    () =>
      createListCollection({
        itemToValue: (item) => item.id.toString(),
        items: data?.components || [],
      }),
    [data],
  );

  return (
    <Listbox.Root
      onValueChange={(el) => {
        const item = el.items.pop();
        if (!item || !data) {
          setSelectedComponent(undefined);
          return;
        }
        setSelectedComponent({ component: item, schema: data });
      }}
      collection={collections}
      width="full"
      height={'full'}
    >
      <Listbox.Content rounded={'none'} border={'none'} height="full" maxH="none">
        {collections.items.map((component) => (
          <Listbox.Item
            item={component}
            key={component.id}
            flex="none"
            rounded="xs"
            _hover={{
              bg: 'bg.emphasized/60',
            }}
            _selected={{
              bg: 'bg.muted',
            }}
          >
            <Listbox.ItemText fontSize="md">{component.name}</Listbox.ItemText>
          </Listbox.Item>
        ))}
      </Listbox.Content>
    </Listbox.Root>
  );
}
