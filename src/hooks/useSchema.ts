import { useQuery } from "@tanstack/react-query";
import { siecsClient } from "../client";

export function useSchema() {
  return useQuery({
    queryKey: ["schema"],
    queryFn: () => siecsClient.schema(),
    refetchInterval: 10000,
  });
}
