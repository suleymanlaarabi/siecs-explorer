import { queryOptions, useQuery } from '@tanstack/react-query';
import { siecsClient } from '../../../lib/siecs/client';
import { healthKeys } from './queryKeys';

export const healthQueries = {
  health: () =>
    queryOptions({
      queryKey: healthKeys.all,
      queryFn: () => siecsClient.health(),
      refetchInterval: 2000,
    }),
};

export function useHealthQuery() {
  return useQuery(healthQueries.health());
}
