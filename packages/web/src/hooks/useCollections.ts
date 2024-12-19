import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type Config = {
  staleTime?: number
}

export const useCollections = (collectionIds: string[], config?: Config) => {
  const { data: sdk } = useSdk()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['collections', collectionIds],
    queryFn: async () => {
      const { data } = await sdk!.full.playlists.getBulkPlaylists({
        id: collectionIds
      })

      data?.forEach((collection) => {
        // Prime user data from collection owner
        if (collection.user) {
          queryClient.setQueryData(
            ['user', collection.user.id],
            collection.user
          )
        }

        // Prime track and user data from tracks in collection
        collection.tracks?.forEach((track) => {
          if (track.id) {
            // Prime track data
            queryClient.setQueryData(['track', track.id], track)

            // Prime user data from track owner
            if (track.user) {
              queryClient.setQueryData(['user', track.user.id], track.user)
            }
          }
        })
      })

      return data
    },
    staleTime: config?.staleTime,
    enabled: !!sdk && collectionIds.length > 0
  })
}
