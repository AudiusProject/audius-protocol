import { OptionalId, full } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import {
  transformAndCleanList,
  userCollectionMetadataFromSDK
} from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import { UserCollectionMetadata } from '~/models/Collection'
import {
  trendingPlaylistsPageLineupActions,
  trendingPlaylistsPageLineupSelectors
} from '~/store/pages'

import { useTypedQueryClient } from './typed-query-client'
import { QUERY_KEYS } from './typed-query-client/queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
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
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: getTrendingPlaylistsQueryKey({ pageSize, time }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserCollectionMetadata[], allPages) => {
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
    select: (data) => data?.pages.flat(),
    ...options,
    enabled: options?.enabled !== false
  })

  return useLineupQuery({
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
