import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useTracks = (trackIds: ID[], config?: Config) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [QUERY_KEYS.tracks, trackIds],
    queryFn: async () => {
      const encodedIds = trackIds
        .map(encodeHashId)
        .filter((id): id is string => id !== null)
      if (encodedIds.length === 0) return []
      const { data } = await audiusSdk!.full.tracks.getBulkTracks({
        id: encodedIds
      })

      // Prime user data from tracks
      data?.forEach((track) => {
        if (track.user) {
          queryClient.setQueryData([QUERY_KEYS.user, track.user.id], track.user)
        }
      })

      return data
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && trackIds.length > 0
  })
}
