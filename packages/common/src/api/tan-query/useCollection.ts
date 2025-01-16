import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useCollection = (collectionId: ID, config?: Config) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.collection, collectionId],
    queryFn: async () => {
      const encodedId = OptionalId.parse(collectionId)
      if (!encodedId) return null
      const { data } = await audiusSdk!.full.playlists.getPlaylist({
        playlistId: encodedId
      })

      if (!data?.[0]) return null
      const collection = userCollectionMetadataFromSDK(data[0])

      if (collection) {
        // Prime user data from collection owner
        if (collection.user) {
          queryClient.setQueryData(
            [QUERY_KEYS.user, collection.user.user_id],
            collection.user
          )
        }

        // Prime track and user data from tracks in collection
        const entries: EntriesByKind = {
          [Kind.COLLECTIONS]: {
            [collection.playlist_id]: collection
          }
        }

        if (collection.user) {
          if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
          entries[Kind.USERS][collection.user.user_id] = collection.user
        }

        // Track and user data from tracks in collection
        collection.tracks?.forEach((track) => {
          if (track.track_id) {
            // Prime track data
            queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)
            if (!entries[Kind.TRACKS]) entries[Kind.TRACKS] = {}
            entries[Kind.TRACKS][track.track_id] = track

            // Prime user data from track owner
            if (track.user) {
              queryClient.setQueryData(
                [QUERY_KEYS.user, track.user.user_id],
                track.user
              )
              if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
              entries[Kind.USERS][track.user.user_id] = track.user
            }
          }
        })

        // Sync all data to Redux in a single dispatch
        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return collection
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && !!collectionId
  })
}
