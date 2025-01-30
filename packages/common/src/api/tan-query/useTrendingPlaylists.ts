import { OptionalId, full } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import {
  transformAndCleanList,
  userCollectionMetadataFromSDK
} from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import {
  trendingPlaylistsPageLineupActions,
  trendingPlaylistsPageLineupSelectors
} from '~/store/pages'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { loadNextPage } from './utils/infiniteQueryLoadNextPage'
import { primeCollectionData } from './utils/primeCollectionData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

export type UseTrendingPlaylistsArgs = {
  pageSize?: number
  time?: full.GetTrendingPlaylistsTimeEnum
}

export const getTrendingPlaylistsQueryKey = ({
  pageSize,
  time
}: UseTrendingPlaylistsArgs) => [
  QUERY_KEYS.trendingPlaylists,
  { pageSize, time }
]

export const useTrendingPlaylists = (
  {
    pageSize = DEFAULT_PAGE_SIZE,
    time = full.GetTrendingPlaylistsTimeEnum.Week
  }: UseTrendingPlaylistsArgs = {},
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: getTrendingPlaylistsQueryKey({ pageSize, time }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()

      const { data = [] } = await sdk.full.playlists.getTrendingPlaylists({
        userId: OptionalId.parse(currentUserId),
        limit: pageSize,
        offset: pageParam,
        time
      })

      const processedPlaylists = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )
      primeCollectionData({
        collections: processedPlaylists,
        queryClient,
        dispatch
      })

      // Update lineup when new data arrives
      dispatch(
        trendingPlaylistsPageLineupActions.fetchLineupMetadatas(
          pageParam,
          pageSize,
          false,
          {
            playlists: processedPlaylists
          }
        )
      )

      return processedPlaylists
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false
  })

  const lineupData = useLineupQuery({
    queryData,
    lineupActions: trendingPlaylistsPageLineupActions,
    lineupSelector: trendingPlaylistsPageLineupSelectors.getLineup,
    playbackSource: PlaybackSource.PLAYLIST_TILE_TRACK
  })

  return {
    ...queryData,
    ...lineupData,
    loadNextPage: loadNextPage(queryData),
    pageSize
  }
}
