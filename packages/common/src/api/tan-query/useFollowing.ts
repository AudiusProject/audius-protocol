import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { useTypedQueryClient } from './typed-query-client'
import { QUERY_KEYS } from './typed-query-client/queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 20

type UseFollowingArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const getFollowingQueryKey = ({ userId, pageSize }: UseFollowingArgs) =>
  [QUERY_KEYS.following, userId, { pageSize }] as const

/**
 * Hook to fetch following for a user with infinite query support.
 * This version supports infinite scrolling and maintains the full list of following.
 */
export const useFollowing = (
  { userId, pageSize = DEFAULT_PAGE_SIZE }: UseFollowingArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: getFollowingQueryKey({ userId, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getFollowing({
        id: Id.parse(userId),
        limit: pageSize,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId)
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users.map((user) => user.user_id)
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
