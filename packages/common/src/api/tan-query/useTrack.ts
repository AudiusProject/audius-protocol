import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

const STALE_TIME = Infinity

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

  return useQuery({
    queryKey: getTrackQueryKey(trackId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.tracks.getTrack({
        trackId: Id.parse(trackId)
      })

      if (!data) return null
      const track = userTrackMetadataFromSDK(data)

      // Prime the user query cache with user data from the track
      if (track?.user) {
        queryClient.setQueryData(
          [QUERY_KEYS.user, track.user.user_id],
          track.user
        )
      }

      // Sync both track and user data to Redux cache in a single dispatch
      if (track) {
        const entries: EntriesByKind = {
          [Kind.TRACKS]: {
            [track.track_id]: track
          }
        }

        if (track.user) {
          entries[Kind.USERS] = {
            [track.user.user_id]: track.user
          }
        }

        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return track
    },
    staleTime: options?.staleTime ?? STALE_TIME,
    enabled: options?.enabled !== false && !!trackId
  })
}
