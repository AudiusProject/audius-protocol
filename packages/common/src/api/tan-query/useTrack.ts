import { useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { getTracksBatcher } from './batchers/getTracksBatcher'
import { TQTrack } from './models'
import { QUERY_KEYS } from './queryKeys'
import { QueryKey, SelectableQueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const getTrackQueryKey = (trackId: ID | null | undefined) => {
  return [QUERY_KEYS.track, trackId] as unknown as QueryKey<TQTrack>
}

export const useTrack = <TResult = TQTrack>(
  trackId: ID | null | undefined,
  options?: SelectableQueryOptions<TQTrack, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()
  const validTrackId = !!trackId && trackId > 0

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(() => options?.select, [])

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

      console.log('queryFn called on ', trackId)
      return await batchGetTracks.fetch(trackId!)
    },
    ...options,
    select,
    enabled: options?.enabled !== false && validTrackId
  })
}
