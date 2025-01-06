import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const useTracks = (trackIds: ID[], options?: QueryOptions) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.tracks, trackIds],
    queryFn: async () => {
      const encodedIds = trackIds!
        .map(encodeHashId)
        .filter((id): id is string => id !== null)
      if (encodedIds.length === 0) return []
      const { data } = await audiusSdk!.full.tracks.getBulkTracks({
        id: encodedIds
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      if (tracks?.length) {
        const entries: EntriesByKind = {
          [Kind.TRACKS]: {}
        }

        tracks.forEach((track) => {
          // Prime track data
          queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)
          entries[Kind.TRACKS]![track.track_id] = track

          // Prime user data from track owner
          if (track.user) {
            queryClient.setQueryData(
              [QUERY_KEYS.user, track.user.user_id],
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
    enabled:
      options?.enabled !== false &&
      !!audiusSdk &&
      trackIds !== null &&
      trackIds !== undefined
  })
}
