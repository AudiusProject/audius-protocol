import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type Config = {
  staleTime?: number
}

export const useCollection = (collectionId: string, config?: Config) => {
  const { data: sdk } = useSdk()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const { data } = await sdk!.full.playlists.getPlaylist({
        playlistId: collectionId
      })
      const collection = data?.[0]

      if (collection) {
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
      }

      return collection
    },
    staleTime: config?.staleTime,
    enabled: !!sdk && !!collectionId
  })
}
