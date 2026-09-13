import { createListCollection, Listbox } from '@chakra-ui/react';
import { useSchema } from '../../hooks/useSchema';
import { useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { worldEditorSelectedRelationAtom } from './atom';

export function RelationList() {
  const { data } = useSchema();

  const setSelectedRelation = useSetAtom(worldEditorSelectedRelationAtom);

  const collections = useMemo(
    () =>
      createListCollection({
        itemToValue: (item) => item.id.toString(),
        items: data?.relations || [],
      }),
    [data],
  );

  return (
    <Listbox.Root
      onValueChange={(el) => {
        const item = el.items.pop();
        if (!item || !data) {
          setSelectedRelation(undefined);
          return;
        }
        setSelectedRelation({ relation: item, schema: data });
      }}
      collection={collections}
      width="full"
      height={'full'}
    >
      <Listbox.Content rounded={'none'} border={'none'} height="full" maxH="none">
        {collections.items.map((relation) => (
          <Listbox.Item
            item={relation}
            key={relation.id}
            flex="none"
            rounded="xs"
            _hover={{
              bg: 'bg.emphasized/60',
            }}
            _selected={{
              bg: 'bg.muted',
            }}
          >
            <Listbox.ItemText fontSize="md">{relation.name}</Listbox.ItemText>
          </Listbox.Item>
        ))}
      </Listbox.Content>
    </Listbox.Root>
  );
}
