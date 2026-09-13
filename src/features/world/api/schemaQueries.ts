import { queryOptions, useQuery } from '@tanstack/react-query';
import { siecsClient } from '../../../lib/siecs/client';
import { schemaKeys } from './queryKeys';

export const schemaQueries = {
  schema: () =>
    queryOptions({
      queryKey: schemaKeys.all,
      queryFn: () => siecsClient.schema(),
      refetchInterval: 10000,
    }),
};

export function useSchemaQuery() {
  return useQuery(schemaQueries.schema());
}
