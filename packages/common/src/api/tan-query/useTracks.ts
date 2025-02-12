import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserTrackMetadata } from '~/models/Track'

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

  return useQueries({
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
        return await batchGetTracks.fetch({
          id: trackId
        })
      },
      ...options,
      enabled: options?.enabled !== false && !!trackId
    })),
    combine: combineQueryResults<UserTrackMetadata[]>
  })
}
