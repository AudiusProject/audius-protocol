import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeTrackData } from './utils/primeTrackData'

export const getTracksQueryKey = (trackIds: ID[] | null | undefined) => [
  QUERY_KEYS.tracks,
  trackIds
]

export const useTracks = (
  trackIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: getTracksQueryKey(trackIds),
    queryFn: async () => {
      const encodedIds = trackIds
        ?.map((id) => OptionalId.parse(id))
        .filter(removeNullable)
      if (!encodedIds || encodedIds.length === 0) return []
      const sdk = await audiusSdk()
      const { data } = await sdk.full.tracks.getBulkTracks({
        id: encodedIds
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      if (tracks?.length) {
        primeTrackData({
          tracks,
          queryClient,
          dispatch
        })
      }

      return tracks
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!trackIds
  })
}
