import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models/Identifiers'

import { getTracksBatcher } from '../batchers/getTracksBatcher'
import { TQTrack } from '../models'
import { QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { combineQueryResults } from '../utils/combineQueryResults'
import { useQueries } from '../utils/useQueries'

import { getTrackQueryFn, getTrackQueryKey } from './useTrack'

// This function is only used for batch operations in saga utilities
export const getTracksQueryFn = async (
  trackIds: ID[],
  currentUserId: ID | null,
  queryClient: any,
  sdk: any,
  dispatch: any
) => {
  const batchGetTracks = getTracksBatcher({
    sdk,
    currentUserId,
    queryClient,
    dispatch
  })
  const tracks = await Promise.all(
    trackIds.map((trackId) => batchGetTracks.fetch(trackId))
  )
  return tracks.filter((track): track is TQTrack => !!track)
}

export const useTracks = (
  trackIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  // Filter out duplicate IDs
  const uniqueTrackIds = useMemo(
    () =>
      trackIds?.filter((id, index, self) => self.indexOf(id) === index && !!id),
    [trackIds]
  )

  const queryResults = useQueries({
    queries: uniqueTrackIds?.map((trackId) => ({
      queryKey: getTrackQueryKey(trackId),
      queryFn: async () => {
        const sdk = await audiusSdk()
        return getTrackQueryFn(
          trackId,
          currentUserId,
          queryClient,
          sdk,
          dispatch
        )
      },
      ...options,
      enabled: options?.enabled !== false && !!trackId && trackId > 0
    })),
    combine: combineQueryResults<TQTrack[]>
  })

  const { data: tracks } = queryResults

  const byId = useMemo(() => keyBy(tracks, 'track_id'), [tracks])

  return {
    data: tracks,
    byId,
    status: queryResults.status,
    isPending: queryResults.isPending,
    isLoading: queryResults.isLoading,
    isFetching: queryResults.isFetching,
    isSuccess: queryResults.isSuccess,
    isError: queryResults.isError
  }
}
