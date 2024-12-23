import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useCollections = (collectionIds: ID[], config?: Config) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [QUERY_KEYS.collections, collectionIds],
    queryFn: async () => {
      const encodedIds = collectionIds
        .map(encodeHashId)
        .filter((id): id is string => id !== null)
      if (encodedIds.length === 0) return []
      const { data } = await audiusSdk!.full.playlists.getBulkPlaylists({
        id: encodedIds
      })

      const collections = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )

      collections?.forEach((collection) => {
        // Prime user data from collection owner
        if (collection.user) {
          queryClient.setQueryData(
            [QUERY_KEYS.user, collection.user.user_id],
            collection.user
          )
        }

        // Prime track and user data from tracks in collection
        collection.tracks?.forEach((track) => {
          if (track.track_id) {
            // Prime track data
            queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)

            // Prime user data from track owner
            if (track.user) {
              queryClient.setQueryData(
                [QUERY_KEYS.user, track.user.user_id],
                track.user
              )
            }
          }
        })
      })

      return collections
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && collectionIds.length > 0
  })
}
