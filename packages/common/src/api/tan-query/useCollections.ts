import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context/appContext'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useCollections = (collectionIds: string[], config?: Config) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [QUERY_KEYS.collections, collectionIds],
    queryFn: async () => {
      const { data } = await audiusSdk!.full.playlists.getBulkPlaylists({
        id: collectionIds
      })

      data?.forEach((collection) => {
        // Prime user data from collection owner
        if (collection.user) {
          queryClient.setQueryData(
            [QUERY_KEYS.user, collection.user.id],
            collection.user
          )
        }

        // Prime track and user data from tracks in collection
        collection.tracks?.forEach((track) => {
          if (track.id) {
            // Prime track data
            queryClient.setQueryData([QUERY_KEYS.track, track.id], track)

            // Prime user data from track owner
            if (track.user) {
              queryClient.setQueryData(
                [QUERY_KEYS.user, track.user.id],
                track.user
              )
            }
          }
        })
      })

      return data
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && collectionIds.length > 0
  })
}
