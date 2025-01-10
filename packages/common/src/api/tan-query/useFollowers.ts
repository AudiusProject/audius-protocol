import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { User } from '~/models/User'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

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
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    ...rest
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.followers, userId, limit],
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
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
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
