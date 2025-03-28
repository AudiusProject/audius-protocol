import { useMemo } from 'react'

import { useQuery, useTypedQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { getTracksBatcher } from './batchers/getTracksBatcher'
import { TQTrack } from './models'
import { QUERY_KEYS } from './queryKeys'
import { SelectableQueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
export const getTrackQueryKey = (trackId: ID | null | undefined) =>
  [QUERY_KEYS.track, trackId] as const

export const useTrack = <TResult = TQTrack>(
  trackId: ID | null | undefined,
  options?: SelectableQueryOptions<TQTrack, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useTypedQueryClient()
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
      return await batchGetTracks.fetch(trackId!)
    },
    ...options,
    select,
    enabled: options?.enabled !== false && validTrackId
  })
}
