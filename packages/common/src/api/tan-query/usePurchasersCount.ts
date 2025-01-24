import { Id, OptionalId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

type UsePurchasersCountArgs = {
  contentId?: ID | null | undefined
  contentType?: string | undefined
}

export const usePurchasersCount = (
  { contentId, contentType }: UsePurchasersCountArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: [QUERY_KEYS.purchasersCount, currentUserId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      if (!currentUserId) return 0
      const { data = 0 } = await sdk.full.users.getPurchasersCount({
        id: Id.parse(currentUserId),
        userId: Id.parse(currentUserId),
        contentId: OptionalId.parse(contentId),
        contentType
      })
      return data
    },

    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
