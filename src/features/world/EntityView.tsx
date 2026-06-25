import { useAtomValue } from "jotai";
import { worldEditorSelectedEntityAtom } from "./atom";
import { useQuery } from "@tanstack/react-query";
import { siecsClient, type Entity } from "../../client";

export function EntityView() {
  const entity = useAtomValue(worldEditorSelectedEntityAtom);

  if (!entity) {
    return;
  }

  return <EntityDetail entity={entity} />;
}

function EntityDetail({ entity }: { entity: Entity }) {
  useQuery({
    queryKey: ["entity", entity.index],
    queryFn: () => siecsClient.entity(entity),
  });

  return null;
}
