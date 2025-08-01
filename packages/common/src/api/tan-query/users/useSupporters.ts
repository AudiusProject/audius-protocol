import { Id, OptionalId } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models/Identifiers'
import {
  SupporterMetadata,
  supporterMetadataListFromSDK
} from '~/models/Tipping'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { primeUserData } from '../utils/primeUserData'

import { useCurrentUserId } from './account/useCurrentUserId'
import { getSupporterQueryKey } from './useSupporter'

const DEFAULT_PAGE_SIZE = 20

type UseSupportersArgs = {
  userId: ID | null | undefined
  pageSize?: number
}

export const getSupportersQueryKey = (
  userId: ID | null | undefined,
  pageSize: number = DEFAULT_PAGE_SIZE
) =>
  [QUERY_KEYS.supporters, userId, pageSize] as unknown as QueryKey<
    InfiniteData<SupporterMetadata[]>
  >

export const useSupporters = (
  { userId, pageSize = DEFAULT_PAGE_SIZE }: UseSupportersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useInfiniteQuery({
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
        queryClient
      })
      return supporters
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
