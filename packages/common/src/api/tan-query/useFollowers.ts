import { useInfiniteQuery } from '@tanstack/react-query'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { User } from '~/models/User'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'

const LIMIT = 15

type UseFollowersArgs = {
  userId: ID | null | undefined
  limit?: number
}

/**
 * Hook to fetch followers for a user with infinite query support.
 * This version supports infinite scrolling and maintains the full list of followers.
 */
export const useFollowers = (
  { userId, limit = LIMIT }: UseFollowersArgs,
  options?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    ...rest
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.followers, userId, { limit }],
    enabled: options?.enabled !== false && !!userId && !!audiusSdk,
    initialPageParam: 0,
    getNextPageParam: (lastPage: User[], allPages) => {
      if (lastPage.length < limit) return undefined
      return allPages.length * limit
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getFollowers({
        id: Id.parse(userId),
        limit,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId)
      })
      return userMetadataListFromSDK(data)
    },
    staleTime: options?.staleTime
  })

  const flatData = data?.pages.flat() ?? []

  return {
    data: flatData,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    loadMore: fetchNextPage,
    isLoading,
    ...rest
  }
}
