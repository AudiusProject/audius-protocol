import { OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import { UserTrackMetadata } from '~/models/Track'
import {
  premiumTracksPageLineupActions,
  premiumTracksPageLineupSelectors
} from '~/store/pages'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

type UsePremiumTracksArgs = {
  pageSize?: number
}

export const getPremiumTracksQueryKey = (pageSize: number) => [
  QUERY_KEYS.premiumTracks,
  pageSize
]

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
    getNextPageParam: (lastPage: UserTrackMetadata[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()

      const { data: tracks } =
        await sdk.full.tracks.getTrendingUSDCPurchaseTracks({
          userId: OptionalId.parse(currentUserId),
          limit: pageSize,
          offset: pageParam
        })

      if (!tracks) return []

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

      return processedTracks
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false
  })

  return useLineupQuery({
    queryData,
    queryKey: getPremiumTracksQueryKey(pageSize),
    lineupActions: premiumTracksPageLineupActions,
    lineupSelector: premiumTracksPageLineupSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })
}
