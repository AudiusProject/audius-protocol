import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserTrackMetadata } from '~/models/Track'

import { getTracksBatcher } from './batchers/getTracksBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const getTrackQueryKey = (trackId: ID | null | undefined) => [
  QUERY_KEYS.track,
  trackId
]

export const useTrack = (
  trackId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery<UserTrackMetadata | null>({
    queryKey: getTrackQueryKey(trackId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      return await getTracksBatcher.fetch({
        id: trackId!,
        context: { sdk, currentUserId, queryClient, dispatch }
      })
    },
    staleTime: options?.staleTime ?? Infinity,
    gcTime: Infinity,
    enabled: options?.enabled !== false && !!trackId
  })
}
