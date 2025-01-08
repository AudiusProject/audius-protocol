import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

export const useCollections = (
  collectionIds: ID[] | null | undefined,
  options?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.collections, collectionIds],
    queryFn: async () => {
      const encodedIds = collectionIds!
        .map(encodeHashId)
        .filter((id): id is string => id !== null)
      if (encodedIds.length === 0) return []
      const sdk = await audiusSdk()
      const { data } = await sdk.full.playlists.getBulkPlaylists({
        id: encodedIds
      })

      const collections = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )

      if (collections?.length) {
        const entries: EntriesByKind = {
          [Kind.COLLECTIONS]: {}
        }

        collections.forEach((collection) => {
          // Prime collection data
          queryClient.setQueryData(
            [QUERY_KEYS.collection, collection.playlist_id],
            collection
          )
          entries[Kind.COLLECTIONS]![collection.playlist_id] = collection

          // Prime user data from collection owner
          if (collection.user) {
            queryClient.setQueryData(
              [QUERY_KEYS.user, collection.user.user_id],
              collection.user
            )
            if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
            entries[Kind.USERS][collection.user.user_id] = collection.user
          }

          // Prime track and user data from tracks in collection
          collection.tracks?.forEach((track) => {
            if (track.track_id) {
              // Prime track data
              queryClient.setQueryData(
                [QUERY_KEYS.track, track.track_id],
                track
              )
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
        })

        // Sync all data to Redux in a single dispatch
        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return collections
    },
    staleTime: options?.staleTime,
    enabled:
      options?.enabled !== false &&
      collectionIds !== null &&
      collectionIds !== undefined
  })
}
