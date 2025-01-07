import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const useTrack = (
  trackId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.track, trackId],
    queryFn: async () => {
      if (!trackId) return null
      const encodedId = encodeHashId(trackId)
      const sdk = await audiusSdk()
      const { data } = await sdk.full.tracks.getTrack({
        trackId: encodedId
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
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!trackId
  })
}
