import { useMemo } from 'react'

import { useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { CommonState } from '~/store'

import { getTracksBatcher } from './batchers/getTracksBatcher'
import { TQTrack } from './models'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getTrackQueryKey } from './useTrack'
import { combineQueryResults } from './utils/combineQueryResults'
import { useQueries } from './utils/useQueries'

export const getTracksQueryKey = (trackIds: ID[] | null | undefined) => [
  QUERY_KEYS.tracks,
  trackIds
]

export const useTracks = (
  trackIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const queryResults = useQueries({
    queries: trackIds?.map((trackId) => ({
      queryKey: getTrackQueryKey(trackId),
      queryFn: async () => {
        const sdk = await audiusSdk()
        const batchGetTracks = getTracksBatcher({
          sdk,
          currentUserId,
          queryClient,
          dispatch
        })
        return await batchGetTracks.fetch(trackId)
      },
      ...options,
      enabled: options?.enabled !== false && !!trackId && trackId > 0
    })),
    combine: combineQueryResults<TQTrack[]>
  }) as UseQueryResult<TQTrack[]> & {
    byId: Record<ID, TQTrack>
  }

  const { data: tracks } = queryResults

  const byId = useMemo(() => keyBy(tracks, 'track_id'), [tracks])

  const isSavedToRedux = useSelector((state: CommonState) =>
    trackIds?.every((trackId) => !!state.tracks.entries[trackId])
  )

  queryResults.data = isSavedToRedux ? tracks : undefined
  queryResults.isPending = queryResults.isPending || !isSavedToRedux
  queryResults.isLoading = queryResults.isLoading || !isSavedToRedux
  queryResults.byId = byId

  return queryResults
}
