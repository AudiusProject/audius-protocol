import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useTrack = (trackId: ID, config?: Config) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [QUERY_KEYS.track, trackId],
    queryFn: async () => {
      const encodedId = encodeHashId(trackId)
      if (!encodedId) return null
      const { data } = await audiusSdk!.full.tracks.getTrack({
        trackId: encodedId
      })

      if (!data) return null
      const track = userTrackMetadataFromSDK(data)

      // Prime the user query cache with user data from the track
      if (track?.user) {
        queryClient.setQueryData(
          [QUERY_KEYS.user, track.user.user_id],
          track.user
        )
      }

      return track
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && !!trackId
  })
}
