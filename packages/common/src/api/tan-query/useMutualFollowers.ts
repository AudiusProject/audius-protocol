import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, OptionalId } from '~/models'
import { Id } from '~/models/Identifiers'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
  enabled?: boolean
}

type MutualFollowersParams = {
  userId: ID | null | undefined
  limit?: number
  offset?: number
  config?: Config
}

/**
 * Hook to get mutual followers between the current user and another user
 */
export const useMutualFollowers = ({
  userId,
  limit,
  offset,
  config
}: MutualFollowersParams) => {
  const { audiusSdk } = useAudiusQueryContext()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.mutualFollowers, userId, limit, offset],
    queryFn: async () => {
      if (!userId) return null
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getMutualFollowers({
        userId: OptionalId.parse(currentUserId),
        id: Id.parse(userId),
        limit,
        offset
      })

      return data ? userMetadataListFromSDK(data) : []
    },
    staleTime: config?.staleTime,
    enabled:
      config?.enabled !== false && !!audiusSdk && !!userId && !!currentUserId
  })
}
