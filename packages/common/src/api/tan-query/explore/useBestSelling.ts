import { HashId, Id, BestSellingItem, full } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'

import { userCollectionMetadataFromSDK } from '~/adapters'
import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import {
  primeCollectionData,
  primeTrackData,
  useQueryContext
} from '~/api/tan-query/utils'
import { SDKInfiniteQueryArgs } from '~/api/types'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

const DEFAULT_PAGE_SIZE = 10

export type UseBestSellingArgs =
  SDKInfiniteQueryArgs<full.GetFullBestSellingRequest>

export type BestSellingItemWithId = BestSellingItem & { id: ID }

export const getBestSellingQueryKey = (
  userId: ID | null | undefined,
  args: UseBestSellingArgs
) => {
  return [QUERY_KEYS.bestSellingItems, userId, args] as unknown as QueryKey<
    InfiniteData<BestSellingItemWithId[]>
  >
}

export const useBestSelling = (
  {
    pageSize = DEFAULT_PAGE_SIZE,
    type = 'all',
    ...args
  }: UseBestSellingArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useInfiniteQuery({
    queryKey: getBestSellingQueryKey(currentUserId, {
      pageSize,
      type,
      ...args
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: BestSellingItemWithId[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [], related = {} } =
        await sdk.full.explore.getFullBestSelling({
          ...args,
          userId: currentUserId ? Id.parse(currentUserId) : undefined,
          type,
          limit: pageSize,
          offset: pageParam
        })

      const tracks = transformAndCleanList(
        related?.tracks,
        userTrackMetadataFromSDK
      )

      primeTrackData({
        tracks,
        queryClient
      })

      const playlists = transformAndCleanList(
        related?.playlists,
        userCollectionMetadataFromSDK
      )

      primeCollectionData({
        collections: playlists,
        queryClient
      })

      return data.map((item) => ({ ...item, id: HashId.parse(item.contentId) }))
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false
  })
}
