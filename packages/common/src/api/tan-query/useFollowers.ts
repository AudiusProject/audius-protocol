import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 15

type UseFollowersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

/**
 * Hook to fetch followers for a user with infinite query support.
 * This version supports infinite scrolling and maintains the full list of followers.
 */
export const useFollowers = (
  { userId, pageSize = DEFAULT_PAGE_SIZE }: UseFollowersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.followers, userId, pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage: User[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getFollowers({
        id: Id.parse(userId),
        limit: pageSize,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId)
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    select: (data) => data.pages.flat(),
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })
}
