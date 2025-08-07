import { HashId, OptionalId, full } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { primeTrackData, useQueryContext } from '~/api/tan-query/utils'
import { SDKInfiniteQueryArgs } from '~/api/types'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

const DEFAULT_PAGE_SIZE = 10

export type UseRecentPremiumTracksArgs =
  SDKInfiniteQueryArgs<full.GetRecentPremiumTracksRequest>

export const getRecentPremiumTracksQueryKey = (
  userId: ID | null | undefined,
  args: UseRecentPremiumTracksArgs
) => {
  return [QUERY_KEYS.recentPremiumTracks, userId, args] as unknown as QueryKey<
    InfiniteData<ID[]>
  >
}

export const useRecentPremiumTracks = (
  { pageSize = DEFAULT_PAGE_SIZE, ...args }: UseRecentPremiumTracksArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useInfiniteQuery({
    queryKey: getRecentPremiumTracksQueryKey(currentUserId, {
      pageSize,
      ...args
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getRecentPremiumTracks({
        ...args,
        userId: OptionalId.parse(currentUserId),
        limit: pageSize,
        offset: pageParam
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      primeTrackData({
        tracks,
        queryClient
      })
      return data.map((item) => HashId.parse(item.id))
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false
  })
}
