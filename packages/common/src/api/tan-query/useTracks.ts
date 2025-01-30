import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { getTrackQueryKey } from './useTrack'
import { getUserQueryKey } from './useUser'

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
        const entries: EntriesByKind = {
          [Kind.TRACKS]: {}
        }

        tracks.forEach((track) => {
          // Prime track data
          queryClient.setQueryData(getTrackQueryKey(track.track_id), track)
          entries[Kind.TRACKS]![track.track_id] = track

          // Prime user data from track owner
          if (track.user) {
            queryClient.setQueryData(
              getUserQueryKey(track.user.user_id),
              track.user
            )
            if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
            entries[Kind.USERS][track.user.user_id] = track.user
          }
        })

        // Sync all data to Redux in a single dispatch
        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return tracks
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!trackIds
  })
}
