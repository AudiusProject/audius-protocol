import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { supporterMetadataListFromSDK } from '~/models/Tipping'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 20

type UseSupportersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const useSupporters = (
  { userId, pageSize = DEFAULT_PAGE_SIZE }: UseSupportersArgs,
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.supporters, userId, pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getSupporters({
        id: Id.parse(userId),
        limit: pageSize,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId)
      })
      const supporters = supporterMetadataListFromSDK(data)

      // Prime the cache for each supporter
      supporters.forEach((supporter) => {
        queryClient.setQueryData(
          [QUERY_KEYS.supporter, userId, supporter.sender.user_id],
          supporter
        )
      })

      primeUserData({
        users: supporters.map((supporter) => supporter.sender),
        queryClient,
        dispatch
      })
      return supporters
    },
    select: (data) => data.pages.flat(),
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })
}
