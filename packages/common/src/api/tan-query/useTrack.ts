import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context/appContext'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useTrack = (trackId: string, config?: Config) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [QUERY_KEYS.track, trackId],
    queryFn: async () => {
      const { data } = await audiusSdk!.full.tracks.getTrack({ trackId })

      // Prime the user query cache with user data from the track
      if (data?.user) {
        queryClient.setQueryData([QUERY_KEYS.user, data.user.id], data.user)
      }

      return data
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && !!trackId
  })
}
