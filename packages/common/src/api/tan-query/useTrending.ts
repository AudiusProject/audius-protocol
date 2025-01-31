import { OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models'
import { TimeRange } from '~/models/TimeRange'
import { StringKeys } from '~/services/remote-config'
import {
  trendingAllTimeActions,
  trendingMonthActions,
  trendingWeekActions
} from '~/store/pages/trending/lineup/actions'
import {
  getDiscoverTrendingWeekLineup,
  getDiscoverTrendingMonthLineup,
  getDiscoverTrendingAllTimeLineup
} from '~/store/pages/trending/selectors'
import { Genre } from '~/utils/genres'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

export const TRENDING_INITIAL_PAGE_SIZE = 10
export const TRENDING_LOAD_MORE_PAGE_SIZE = 4

type GetTrendingArgs = {
  timeRange: TimeRange
  genre?: Genre
  initialPageSize?: number
  loadMorePageSize?: number
}

export const useTrending = (
  {
    timeRange = TimeRange.WEEK,
    genre,
    initialPageSize = TRENDING_INITIAL_PAGE_SIZE,
    loadMorePageSize = TRENDING_LOAD_MORE_PAGE_SIZE
  }: GetTrendingArgs,
  options?: QueryOptions
) => {
  const { audiusSdk, remoteConfigInstance } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const dispatch = useDispatch()

  const infiniteQueryData = useInfiniteQuery({
    queryKey: [QUERY_KEYS.trending, timeRange, genre],
    initialPageParam: 0,
    staleTime: options?.staleTime,
    getNextPageParam: (lastPage, allPages) => {
      const isFirstPage = allPages.length === 1
      const currentPageSize = isFirstPage ? initialPageSize : loadMorePageSize
      if (lastPage.length < currentPageSize) return undefined
      return allPages.reduce((total, page) => total + page.length, 0)
    },
    enabled: !!currentUserId && options?.enabled !== false && !!timeRange,
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const version = remoteConfigInstance.getRemoteVar(
        StringKeys.TRENDING_EXPERIMENT
      )
      const isFirstPage = pageParam === 0
      const currentPageSize = isFirstPage ? initialPageSize : loadMorePageSize

      const { data: sdkResponse = [] } = version
        ? await sdk.full.tracks.getTrendingTracksWithVersion({
            time: timeRange,
            genre: (genre as string) || undefined,
            userId: OptionalId.parse(currentUserId),
            limit: currentPageSize,
            offset: pageParam,
            version
          })
        : await sdk.full.tracks.getTrendingTracks({
            time: timeRange,
            genre: (genre as string) || undefined,
            userId: OptionalId.parse(currentUserId),
            limit: currentPageSize,
            offset: pageParam
          })

      const tracks = transformAndCleanList(
        sdkResponse,
        userTrackMetadataFromSDK
      )

      primeTrackData({ tracks, queryClient, dispatch })

      // Dispatch the data to the lineup sagas
      switch (timeRange) {
        case TimeRange.WEEK:
          dispatch(
            trendingWeekActions.fetchLineupMetadatas(
              pageParam,
              currentPageSize,
              false,
              { tracks }
            )
          )
          break
        case TimeRange.MONTH:
          dispatch(
            trendingMonthActions.fetchLineupMetadatas(
              pageParam,
              currentPageSize,
              false,
              { tracks }
            )
          )
          break
        case TimeRange.ALL_TIME:
          dispatch(
            trendingAllTimeActions.fetchLineupMetadatas(
              pageParam,
              currentPageSize,
              false,
              { tracks }
            )
          )
          break
      }
      return tracks
    },
    select: (data) => data.pages.flat()
  })

  let lineupActions
  let lineupSelector
  switch (timeRange) {
    case TimeRange.MONTH:
      lineupActions = trendingMonthActions
      lineupSelector = getDiscoverTrendingMonthLineup
      break
    case TimeRange.ALL_TIME:
      lineupActions = trendingAllTimeActions
      lineupSelector = getDiscoverTrendingAllTimeLineup
      break
    case TimeRange.WEEK:
      lineupActions = trendingWeekActions
      lineupSelector = getDiscoverTrendingWeekLineup
      break
  }
  const lineupData = useLineupQuery({
    queryData: infiniteQueryData,
    lineupActions,
    lineupSelector,
    playbackSource: PlaybackSource.TRACK_TILE_LINEUP // TODO: shouldn't this be more specific?
  })

  return { ...infiniteQueryData, ...lineupData }
}
