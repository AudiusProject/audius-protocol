import { Id, OptionalId } from '@audius/sdk'
import { QueryClient, useQueries, useQueryClient } from '@tanstack/react-query'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserTrackMetadata } from '~/models/Track'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getTrackQueryKey } from './useTrack'
import { combineQueryResults } from './utils/combineQueryResults'
import { primeTrackData } from './utils/primeTrackData'

type BatchContext = {
  sdk: any
  currentUserId: ID | null | undefined
  queryClient: QueryClient
  dispatch: Dispatch
}

type BatchQuery = {
  id: ID
  context: BatchContext
}

const getTracksBatcher = create({
  fetcher: async (queries: BatchQuery[]): Promise<UserTrackMetadata[]> => {
    // Hack because batshit doesn't support context properly
    const { sdk, currentUserId, queryClient, dispatch } = queries[0].context
    if (!queries.length) return []
    const ids = queries.map((q) => q.id)
    const { data } = await sdk.full.tracks.getBulkTracks({
      id: ids.map((id: ID) => Id.parse(id)).filter(removeNullable),
      userId: OptionalId.parse(currentUserId)
    })

    const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)
    primeTrackData({ tracks, queryClient, dispatch })

    return tracks
  },
  resolver: keyResolver('track_id'),
  scheduler: windowScheduler(10)
})

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
        return await getTracksBatcher.fetch({
          id: trackId,
          context: { sdk, currentUserId, queryClient, dispatch }
        })
      },
      ...options,
      enabled: options?.enabled !== false && !!trackId,
      staleTime: options?.staleTime ?? Infinity,
      gcTime: Infinity
    })),
    combine: combineQueryResults<UserTrackMetadata[]>
  })
}
