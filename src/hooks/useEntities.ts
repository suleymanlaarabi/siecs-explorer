import { useQuery } from "@tanstack/react-query";
import { siecsClient } from "../client";

export function useEntities() {
  const query = useQuery({
    queryKey: ["entities"],
    queryFn: () => siecsClient.entities(),
    refetchInterval: 2500,
  });

  return query;
}
