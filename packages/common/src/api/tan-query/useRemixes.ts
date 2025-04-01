import { useEffect } from 'react'

import { Id, OptionalId, EntityType } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import {
  remixesPageLineupActions,
  remixesPageSelectors,
  remixesPageActions
} from '~/store/pages'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions, LineupData } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

export type UseRemixesArgs = {
  trackId: number | null | undefined
  pageSize?: number
}

export const getRemixesQueryKey = ({
  trackId,
  pageSize = DEFAULT_PAGE_SIZE
}: UseRemixesArgs) => [QUERY_KEYS.remixes, trackId, { pageSize }]

export const useRemixes = (
  { trackId, pageSize = DEFAULT_PAGE_SIZE }: UseRemixesArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  useEffect(() => {
    if (trackId) {
      dispatch(remixesPageActions.fetchTrackSucceeded({ trackId }))
    }
  }, [dispatch, trackId])

  const queryData = useInfiniteQuery({
    queryKey: getRemixesQueryKey({ trackId, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: LineupData, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()

      const { data = { count: 0, tracks: [] } } =
        await sdk.full.tracks.getTrackRemixes({
          trackId: Id.parse(trackId),
          userId: OptionalId.parse(currentUserId),
          limit: pageSize,
          offset: pageParam
        })

      const processedTracks = transformAndCleanList(
        data.tracks,
        userTrackMetadataFromSDK
      )
      primeTrackData({ tracks: processedTracks, queryClient, dispatch })

      // Update lineup when new data arrives
      dispatch(
        remixesPageLineupActions.fetchLineupMetadatas(
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
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!trackId
  })

  return useLineupQuery({
    queryData,
    queryKey: getRemixesQueryKey({
      trackId,
      pageSize
    }),
    lineupActions: remixesPageLineupActions,
    lineupSelector: remixesPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })
}
