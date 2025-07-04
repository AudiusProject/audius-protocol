import { HashId, Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseRecentPremiumTracksArgs = {
  userId: ID | null | undefined
}

export const getRecentPremiumTracksQueryKey = ({
  userId
}: UseRecentPremiumTracksArgs) => {
  return [QUERY_KEYS.recentPremiumTracks, userId] as unknown as QueryKey<ID[]>
}

export const useRecentPremiumTracks = <TResult = ID[]>(
  options?: SelectableQueryOptions<ID[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getRecentPremiumTracksQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.tracks.getRecentPremiumTracks({
        userId: Id.parse(currentUserId)
      })
      return data.map((item) => HashId.parse(item.id))
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
