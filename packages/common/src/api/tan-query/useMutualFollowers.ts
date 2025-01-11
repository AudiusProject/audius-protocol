import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, OptionalId } from '~/models'
import { Id } from '~/models/Identifiers'
import { User } from '~/models/User'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 20

type UseMutualFollowersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const useMutualFollowers = (
  { userId, pageSize = DEFAULT_PAGE_SIZE }: UseMutualFollowersArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const currentUserId = useSelector(getUserId)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.mutualFollowers, userId, pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
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
    select: (data: InfiniteData<User[]>) => data.pages.flat(),
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId && !!currentUserId
  })
}
