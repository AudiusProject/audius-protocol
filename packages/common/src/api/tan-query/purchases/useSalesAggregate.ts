import { Id, SalesAggregate } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export const getSalesAggregateQueryKey = (userId: ID | null | undefined) => {
  return [QUERY_KEYS.salesAggregate, userId] as unknown as QueryKey<
    SalesAggregate[] | null
  >
}

export const useSalesAggregate = <
  TResult = SalesAggregate[] | null | undefined
>(
  options?: SelectableQueryOptions<SalesAggregate[] | null | undefined, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getSalesAggregateQueryKey(currentUserId),
    queryFn: async () => {
      if (!currentUserId) return null
      const sdk = await audiusSdk()
      const { data } = await sdk.users.getSalesAggregate({
        id: Id.parse(currentUserId)
      })
      return data
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
