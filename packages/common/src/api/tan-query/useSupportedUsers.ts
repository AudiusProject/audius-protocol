import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { supportedUserMetadataListFromSDK } from '~/models/Tipping'
import { SUPPORTING_PAGINATION_SIZE } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseSupportedUsersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const useSupportedUsers = (
  { userId, pageSize = SUPPORTING_PAGINATION_SIZE }: UseSupportedUsersArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.supportedUsers, userId, pageSize],
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
      supporting.forEach((supportedUser) => {
        queryClient.setQueryData(
          [QUERY_KEYS.supporter, supportedUser.receiver.user_id, userId],
          supportedUser
        )
      })

      primeUserData({
        users: supporting.map((supportedUser) => supportedUser.receiver),
        queryClient,
        dispatch
      })
      return supporting
    },
    select: (data) => data.pages.flat(),
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })
}
