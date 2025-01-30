import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { supportedUserMetadataListFromSDK } from '~/models/Tipping'
import { SUPPORTING_PAGINATION_SIZE } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getSupporterQueryKey } from './useSupporter'
import { batchSetQueriesData } from './utils/batchSetQueriesData'
import { primeUserData } from './utils/primeUserData'

type UseSupportedUsersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const getSupportedUsersQueryKey = (
  userId: ID | null | undefined,
  pageSize: number
) => [QUERY_KEYS.supportedUsers, userId, pageSize]

export const useSupportedUsers = (
  { userId, pageSize = SUPPORTING_PAGINATION_SIZE }: UseSupportedUsersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: getSupportedUsersQueryKey(userId, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getSupportedUsers({
        id: Id.parse(userId),
        limit: pageSize,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId)
      })
      const supporting = supportedUserMetadataListFromSDK(data)

      // Prime the cache for each supporter
      batchSetQueriesData(
        queryClient,
        supporting.map((supportedUser) => ({
          queryKey: getSupporterQueryKey(
            supportedUser.receiver.user_id,
            userId
          ),
          data: supportedUser
        }))
      )

      primeUserData({
        users: supporting.map((supportedUser) => supportedUser.receiver),
        queryClient,
        dispatch
      })
      return supporting
    },
    select: (data) => data.pages.flat(),
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })
}
