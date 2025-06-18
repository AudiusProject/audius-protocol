import { OptionalId, full, EntityType } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import {
  transformAndCleanList,
  userCollectionMetadataFromSDK
} from '~/adapters'
import { useQueryContext } from '~/api/tan-query/utils'
import { PlaybackSource } from '~/models/Analytics'
import {
  trendingPlaylistsPageLineupActions,
  trendingPlaylistsPageLineupSelectors
} from '~/store/pages'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions, LineupData } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { primeCollectionData } from '../utils/primeCollectionData'

import { useLineupQuery } from './useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

export type UseTrendingPlaylistsArgs = {
  pageSize?: number
  time?: full.GetTrendingPlaylistsTimeEnum
}

export const getTrendingPlaylistsQueryKey = ({
  pageSize,
  time
}: UseTrendingPlaylistsArgs) =>
  [QUERY_KEYS.trendingPlaylists, { pageSize, time }] as unknown as QueryKey<
    InfiniteData<LineupData[]>
  >

export const useTrendingPlaylists = (
  {
    pageSize = DEFAULT_PAGE_SIZE,
    time = full.GetTrendingPlaylistsTimeEnum.Week
  }: UseTrendingPlaylistsArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: getTrendingPlaylistsQueryKey({ pageSize, time }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: LineupData[], allPages) => {
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
        queryClient
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

      return processedPlaylists.map((p) => ({
        id: p.playlist_id,
        type: EntityType.PLAYLIST
      }))
    },
    select: (data) => data?.pages.flat(),
    ...options,
    enabled: options?.enabled !== false
  })

  return useLineupQuery({
    lineupData: queryData.data ?? [],
    queryData,
    queryKey: getTrendingPlaylistsQueryKey({
      pageSize,
      time
    }),
    lineupActions: trendingPlaylistsPageLineupActions,
    lineupSelector: trendingPlaylistsPageLineupSelectors.getLineup,
    playbackSource: PlaybackSource.PLAYLIST_TILE_TRACK,
    pageSize
  })
}
