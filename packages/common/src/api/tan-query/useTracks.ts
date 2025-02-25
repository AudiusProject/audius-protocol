import { useMemo } from 'react'

import { useQueries, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { TrackMetadata } from '~/models/Track'

import { getTracksBatcher } from './batchers/getTracksBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getTrackQueryKey } from './useTrack'
import { combineQueryResults } from './utils/combineQueryResults'

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

  const { data: tracks, ...queryResults } = useQueries({
    queries: (trackIds ?? []).map((trackId) => ({
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
      enabled: options?.enabled !== false && !!trackId
    })),
    combine: combineQueryResults<TrackMetadata[]>
  })

  const byId = useMemo(() => keyBy(tracks, 'track_id'), [tracks])

  return {
    data: tracks,
    byId,
    ...queryResults
  }
}
