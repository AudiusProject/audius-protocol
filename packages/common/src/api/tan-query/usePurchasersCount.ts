import { Id, OptionalId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

type UsePurchasersCountArgs = {
  userId: ID | null | undefined
  contentId?: ID | null | undefined
  contentType?: string | undefined
}

export const usePurchasersCount = (
  { userId, contentId, contentType }: UsePurchasersCountArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.purchasersCount, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()

      const { data = 0 } = await sdk.full.users.getPurchasersCount({
        id: Id.parse(userId),
        userId: OptionalId.parse(userId),
        contentId: OptionalId.parse(contentId),
        contentType
      })
      return data
    },

    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!audiusSdk && !!userId
  })
}
