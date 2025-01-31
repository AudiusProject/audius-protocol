import { HashId, Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export type UseRemixedTracksArgs = {
  userId: ID | null | undefined
}

export const getRemixedTracksQueryKey = ({ userId }: UseRemixedTracksArgs) => [
  QUERY_KEYS.remixedTracks,
  userId
]

export const useRemixedTracks = (options?: QueryOptions) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getRemixedTracksQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.users.getUserTracksRemixed({
        id: Id.parse(currentUserId),
        userId: Id.parse(currentUserId)
      })

      return data.map((item) => ({
        ...item,
        trackId: HashId.parse(item.trackId)
      }))
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
