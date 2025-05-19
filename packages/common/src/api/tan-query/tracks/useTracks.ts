import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models/Identifiers'
import { CommonState } from '~/store'

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

  const queryResults = useQueries({
    queries: trackIds?.map((trackId) => ({
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

  const isSavedToRedux = useSelector((state: CommonState) =>
    trackIds?.every((trackId) => !!state.tracks.entries[trackId])
  )

  return {
    data: isSavedToRedux ? tracks : undefined,
    byId,
    status: isSavedToRedux ? queryResults.status : 'pending',
    isPending: queryResults.isPending || !isSavedToRedux,
    isLoading: queryResults.isLoading || !isSavedToRedux,
    isFetching: queryResults.isFetching,
    isSuccess: queryResults.isSuccess,
    isError: queryResults.isError
  }
}
