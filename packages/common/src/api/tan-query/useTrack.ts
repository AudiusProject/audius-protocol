import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { getTracksBatcher } from './batchers/getTracksBatcher'
import { TQTrack } from './models'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
export const getTrackQueryKey = (trackId: ID | null | undefined) => [
  QUERY_KEYS.track,
  trackId
]

export const useTrack = <TResult = TQTrack>(
  trackId: ID | null | undefined,
  options?: QueryOptions<TQTrack, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()
  const validTrackId = !!trackId && trackId > 0

  return useQuery({
    queryKey: getTrackQueryKey(trackId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const batchGetTracks = getTracksBatcher({
        sdk,
        currentUserId,
        queryClient,
        dispatch
      })
      return await batchGetTracks.fetch(trackId!)
    },
    ...options,
    enabled: options?.enabled !== false && validTrackId
  })
}
