import { useQuery } from "@tanstack/react-query";
import { entityId, siecsClient, type EntityLike } from "../client";

export function useEntities(entity: EntityLike = 0) {
  const id = entityId(entity);

  const query = useQuery({
    queryKey: id ? ["entities", id] : ["entities"],
    queryFn: () => siecsClient.entities(),
  });

  return query;
}
