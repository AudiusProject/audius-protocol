import { Id, OptionalId } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models/Identifiers'
import {
  SupportedUserMetadata,
  supportedUserMetadataListFromSDK
} from '~/models/Tipping'
import { SUPPORTING_PAGINATION_SIZE } from '~/utils/constants'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { primeUserData } from '../utils/primeUserData'

import { useCurrentUserId } from './account/useCurrentUserId'
import { getSupporterQueryKey } from './useSupporter'

type UseSupportedUsersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const getSupportedUsersQueryKey = (
  userId: ID | null | undefined,
  pageSize: number = SUPPORTING_PAGINATION_SIZE
) =>
  [QUERY_KEYS.supportedUsers, userId, pageSize] as unknown as QueryKey<
    InfiniteData<SupportedUserMetadata[]>
  >

export const useSupportedUsers = (
  { userId, pageSize = SUPPORTING_PAGINATION_SIZE }: UseSupportedUsersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  return useInfiniteQuery({
    queryKey: getSupportedUsersQueryKey(userId, pageSize),
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: SupportedUserMetadata[],
      allPages: SupportedUserMetadata[][]
    ) => {
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
          getSupporterQueryKey(supportedUser.receiver.user_id, userId),
          {
            ...supportedUser,
            sender: supportedUser.receiver
          }
        )
      })

      primeUserData({
        users: supporting.map((supportedUser) => supportedUser.receiver),
        queryClient
      })
      return supporting
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
