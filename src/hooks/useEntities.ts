import { useQuery } from "@tanstack/react-query";
import { siecsClient } from "../client";

export function useEntities() {
  const query = useQuery({
    queryKey: ["entities"],
    queryFn: () => siecsClient.entities(),
  });

  return query;
}
