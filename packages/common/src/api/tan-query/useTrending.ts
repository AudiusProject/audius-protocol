import { Id } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
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

export const useTrending = (args: GetTrendingArgs, options: Config) => {
  const { timeRange, genre, pageSize = PAGE_SIZE } = args
  const { audiusSdk, remoteConfigInstance } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const currentUserId = useCurrentUserId()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.trending, args],
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
        time: timeRange,
        genre: genre ?? undefined,
        userId: Id.parse(currentUserId),
        limit: pageSize,
        offset: pageParam,
        version
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
    select: (data) => data.pages.flat(),
    ...options
  })
}
