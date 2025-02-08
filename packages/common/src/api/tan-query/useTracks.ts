import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
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
  const { data: currentUserId } = useCurrentUserId()
  const encodedIds = trackIds
    ?.map((id) => OptionalId.parse(id))
    .filter(removeNullable)

  return useQuery({
    queryKey: getTracksQueryKey(trackIds),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.tracks.getBulkTracks({
        id: encodedIds,
        userId: OptionalId.parse(currentUserId)
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      primeTrackData({ tracks, queryClient, dispatch })

      const tracksMap = keyBy(tracks, 'track_id')
      return trackIds?.map((id) => tracksMap[id])
    },
    ...options,
    enabled: options?.enabled !== false && encodedIds && encodedIds.length > 0
  })
}
