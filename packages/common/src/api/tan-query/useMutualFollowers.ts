import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, OptionalId } from '~/models'
import { Id } from '~/models/Identifiers'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeUserData } from './utils/primeUserData'

type MutualFollowersParams = {
  userId: ID | null | undefined
  limit?: number
  offset?: number
}

/**
 * Hook to get mutual followers between the current user and another user
 */
export const useMutualFollowers = (
  { userId, limit, offset }: MutualFollowersParams,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const currentUserId = useSelector(getUserId)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.mutualFollowers, userId, limit, offset],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getMutualFollowers({
        userId: OptionalId.parse(currentUserId),
        id: Id.parse(userId),
        limit,
        offset
      })

      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId && !!currentUserId
  })
}
