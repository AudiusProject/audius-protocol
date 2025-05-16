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

import { getTrackQueryKey } from './useTrack'

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
