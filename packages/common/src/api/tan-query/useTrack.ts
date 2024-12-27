import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useTrack = (trackId: ID, config?: Config) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.track, trackId],
    queryFn: async () => {
      const encodedId = encodeHashId(trackId)
      if (!encodedId) return null
      const { data } = await audiusSdk!.full.tracks.getTrack({
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
    staleTime: config?.staleTime,
    enabled:
      !!audiusSdk &&
      !!trackId &&
      (config && 'enabled' in config ? config.enabled : true)
  })
}
