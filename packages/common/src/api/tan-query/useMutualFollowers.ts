import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, UserMetadata } from '~/models'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 20

type UseMutualFollowersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const getMutualFollowersQueryKey = (
  userId: UseMutualFollowersArgs['userId']
) => [QUERY_KEYS.mutualFollowers, userId]

export const useMutualFollowers = (
  { userId, pageSize = DEFAULT_PAGE_SIZE }: UseMutualFollowersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const currentUserId = useSelector(getUserId)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: getMutualFollowersQueryKey(userId),
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserMetadata[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getMutualFollowers({
        userId: OptionalId.parse(currentUserId),
        id: Id.parse(userId),
        limit: pageSize,
        offset: pageParam
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    select: (data) => data.pages.flat(),
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId && !!currentUserId
  })
}
