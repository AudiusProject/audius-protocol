import { useMemo } from 'react'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { OptionalId } from '~/models/Identifiers'
import { TimeRange } from '~/models/TimeRange'
import { Track } from '~/models/Track'
import { StringKeys } from '~/services/remote-config'
import { Genre } from '~/utils/genres'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'

const PAGE_SIZE = 10

type GetTrendingArgs = {
  timeRange: TimeRange
  genre?: Genre | null
  pageSize?: number
}

export const useTrending = (
  { timeRange, genre, pageSize = PAGE_SIZE }: GetTrendingArgs,
  config: Config
) => {
  const { audiusSdk, remoteConfigInstance } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const currentUserId = useCurrentUserId()
  const dispatch = useDispatch()

  const queryResult = useInfiniteQuery({
    queryKey: [QUERY_KEYS.trending, timeRange, genre, pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage: Track[], allPages: Track[][]) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const version = remoteConfigInstance.getRemoteVar(
        StringKeys.TRENDING_EXPERIMENT
      )

      const args = {
        limit: pageSize,
        offset: pageParam,
        time: timeRange,
        genre: genre ?? undefined,
        userId: OptionalId.parse(currentUserId)
      }

      const { data = [] } = version
        ? await sdk.full.tracks.getTrendingTracksWithVersion({
            ...args,
            version
          })
        : await sdk.full.tracks.getTrendingTracks(args)

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      primeTrackData({ tracks, queryClient, dispatch })

      return tracks
    },
    ...config
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, ...rest } =
    queryResult

  const flatData = useMemo(() => data?.pages.flat() ?? [], [data?.pages])

  return {
    data: flatData,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    ...rest
  }
}
