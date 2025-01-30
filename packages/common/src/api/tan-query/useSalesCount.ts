import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const getSalesCountQueryKey = (userId: ID | null | undefined) => [
  QUERY_KEYS.salesCount,
  userId
]

export const useSalesCount = (
  userId: ID | null | undefined,
  options?: QueryOptions
) => {
  const context = useAudiusQueryContext()
  const audiusSdk = context.audiusSdk

  return useQuery({
    queryKey: getSalesCountQueryKey(userId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = 0 } = await sdk.full.users.getSalesCount({
        id: Id.parse(userId),
        userId: Id.parse(userId)
      })
      return data
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!audiusSdk && !!userId
  })
}
