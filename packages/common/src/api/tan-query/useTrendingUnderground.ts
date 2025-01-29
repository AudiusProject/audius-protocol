import { OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import {
  trendingUndergroundPageLineupActions,
  trendingUndergroundPageLineupSelectors
} from '~/store/pages'

import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

type UseTrendingUndergroundArgs = {
  pageSize?: number
}

export const useTrendingUnderground = (
  { pageSize = DEFAULT_PAGE_SIZE }: UseTrendingUndergroundArgs = {},
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: ['trendingUnderground', pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()

      const { data = [] } = await sdk.full.tracks.getUndergroundTrendingTracks({
        offset: pageParam,
        limit: pageSize,
        userId: OptionalId.parse(currentUserId)
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      primeTrackData({ tracks, queryClient, dispatch })

      // Update lineup when new data arrives
      dispatch(
        trendingUndergroundPageLineupActions.fetchLineupMetadatas(
          pageParam,
          pageSize,
          false,
          { tracks }
        )
      )

      return tracks
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false
  })

  const lineupData = useLineupQuery({
    queryData,
    lineupActions: trendingUndergroundPageLineupActions,
    lineupSelector: trendingUndergroundPageLineupSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE
  })

  return {
    ...queryData,
    ...lineupData,
    pageSize
  }
}
