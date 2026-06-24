import { createListCollection, Listbox } from "@chakra-ui/react";
import { useComponents } from "../../hooks/useComponents";
import { useMemo } from "react";

export function ComponentList() {
  const { data } = useComponents();

  const collections = useMemo(
    () =>
      createListCollection({
        itemToValue: (item) => item.id.toString(),
        items: data || [],
      }),
    [data],
  );

  return (
    <Listbox.Root collection={collections} width="full" h={"full"}>
      <Listbox.Content rounded={"none"} border={"none"}>
        {collections.items.map((component) => (
          <Listbox.Item item={component} key={component.id}>
            <Listbox.ItemText>{component.name}</Listbox.ItemText>
          </Listbox.Item>
        ))}
      </Listbox.Content>
    </Listbox.Root>
  );
}
