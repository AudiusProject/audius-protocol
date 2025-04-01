import { Id, OptionalId } from '@audius/sdk'
import { QueryKey, useInfiniteQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import {
  SupporterMetadata,
  supporterMetadataListFromSDK
} from '~/models/Tipping'

import { useTypedQueryClient } from './typed-query-client'
import { QUERY_KEYS } from './typed-query-client/queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getSupporterQueryKey } from './useSupporter'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 20

type UseSupportersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const getSupportersQueryKey = (
  userId: ID | null | undefined,
  pageSize: number
) => [QUERY_KEYS.supporters, userId, pageSize] as const

export const useSupporters = (
  { userId, pageSize = DEFAULT_PAGE_SIZE }: UseSupportersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery<
    SupporterMetadata[],
    Error,
    SupporterMetadata[],
    QueryKey,
    number
  >({
    queryKey: getSupportersQueryKey(userId, pageSize),
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: SupporterMetadata[],
      allPages: SupporterMetadata[][]
    ) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }): Promise<SupporterMetadata[]> => {
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
          getSupporterQueryKey(userId, supporter.sender.user_id),
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
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
