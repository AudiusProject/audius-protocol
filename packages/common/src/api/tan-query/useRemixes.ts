import { useEffect } from 'react'

import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { UserTrack } from '~/models'
import { PlaybackSource } from '~/models/Analytics'
import {
  remixesPageLineupActions,
  remixesPageSelectors,
  remixesPageActions
} from '~/store/pages'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { loadNextPage } from './utils/infiniteQueryLoadNextPage'
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
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  useEffect(() => {
    if (trackId) {
      dispatch(remixesPageActions.setTrackId({ trackId }))
    }
  }, [dispatch, trackId])

  const queryData = useInfiniteQuery({
    queryKey: getRemixesQueryKey({ trackId, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserTrack[], allPages) => {
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

      return processedTracks
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!trackId
  })

  const lineupData = useLineupQuery({
    queryData,
    lineupActions: remixesPageLineupActions,
    lineupSelector: remixesPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE
  })

  return {
    ...queryData,
    ...lineupData,
    loadNextPage: loadNextPage(queryData),
    pageSize
  }
}
