import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type Config = {
  staleTime?: number
}

export const useTracks = (trackIds: string[], config?: Config) => {
  const { data: sdk } = useSdk()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['tracks', trackIds],
    queryFn: async () => {
      const { data } = await sdk!.full.tracks.getBulkTracks({
        id: trackIds
      })

      // Prime user data from tracks
      data?.forEach((track) => {
        if (track.user) {
          queryClient.setQueryData(['user', track.user.id], track.user)
        }
      })

      return data
    },
    staleTime: config?.staleTime,
    enabled: !!sdk && trackIds.length > 0
  })
}
