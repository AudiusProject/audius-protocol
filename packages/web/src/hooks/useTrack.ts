import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type Config = {
  staleTime?: number
}

export const useTrack = (trackId: string, config?: Config) => {
  const { data: sdk } = useSdk()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['track', trackId],
    queryFn: async () => {
      const { data } = await sdk!.full.tracks.getTrack({ trackId })

      // Prime the user query cache with user data from the track
      if (data?.user) {
        queryClient.setQueryData(['user', data.user.id], data.user)
      }

      return data
    },
    staleTime: config?.staleTime,
    enabled: !!sdk && !!trackId
  })
}
