import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const getSalesAggregateQueryKey = (userId: ID | null | undefined) => [
  QUERY_KEYS.salesAggregate,
  userId
]

export const useSalesAggregate = (options?: QueryOptions) => {
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
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
