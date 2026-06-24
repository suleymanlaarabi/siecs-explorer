import { createListCollection, Listbox } from "@chakra-ui/react";
import { useComponents } from "../../hooks/useComponents";
import { useMemo } from "react";
import { useSetAtom } from "jotai";
import { worldEditorSelectedComponentAtom } from "./atom";

export function ComponentList() {
  const { data } = useComponents();

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
        setSelectedComponent(item);
      }}
      collection={collections}
      width="full"
      h={"full"}
    >
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
