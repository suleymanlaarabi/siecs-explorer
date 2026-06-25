import { useQuery } from "@tanstack/react-query";
import { siecsClient } from "../client";

export function useComponents(id: number = 0) {
  const query = useQuery({
    queryKey: id ? ["components", id] : ["components"],
    queryFn: () => siecsClient.schema(),
    refetchInterval: 10000,
  });

  return query;
}
