import { OptionalId, EntityType } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models'
import {
  premiumTracksPageLineupActions,
  premiumTracksPageLineupSelectors
} from '~/store/pages'

import { QUERY_KEYS } from './queryKeys'
import { QueryKey, LineupData, QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

type UsePremiumTracksArgs = {
  pageSize?: number
}

export const getPremiumTracksQueryKey = (pageSize: number) => {
  return [QUERY_KEYS.premiumTracks, pageSize] as unknown as QueryKey<
    InfiniteData<LineupData[]>
  >
}

export const usePremiumTracks = (
  { pageSize = DEFAULT_PAGE_SIZE }: UsePremiumTracksArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: getPremiumTracksQueryKey(pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage: LineupData[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data: tracks = [] } =
        await sdk.full.tracks.getTrendingUSDCPurchaseTracks({
          userId: OptionalId.parse(currentUserId),
          limit: pageSize,
          offset: pageParam
        })

      const processedTracks = transformAndCleanList(
        tracks,
        userTrackMetadataFromSDK
      )

      primeTrackData({ tracks: processedTracks, queryClient, dispatch })

      // Update lineup when new data arrives
      dispatch(
        premiumTracksPageLineupActions.fetchLineupMetadatas(
          pageParam,
          pageSize,
          false,
          { tracks: processedTracks }
        )
      )

      return processedTracks.map((t) => ({
        id: t.track_id,
        type: EntityType.TRACK
      }))
    },
    select: (data) => data?.pages.flat(),
    ...options,
    enabled: options?.enabled !== false
  })

  return useLineupQuery({
    lineupData: queryData.data ?? [],
    queryData,
    queryKey: getPremiumTracksQueryKey(pageSize),
    lineupActions: premiumTracksPageLineupActions,
    lineupSelector: premiumTracksPageLineupSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })
}
