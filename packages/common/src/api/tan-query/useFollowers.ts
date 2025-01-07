import { useQuery } from '@tanstack/react-query'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

type GetFollowersArgs = {
  userId: Nullable<ID>
  limit?: number
  offset?: number
}

/**
 * Hook to fetch followers for a user with pagination support.
 * NOTE: this is not an infinite query, it only gives you data by your requested limit/offset args
 * If no userId is provided, it will use the current user's ID from the store.
 */
export const useFollowers = (
  { userId, limit = 10, offset = 0 }: GetFollowersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAppContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: [QUERY_KEYS.followers, userId, { limit, offset }],
    enabled: options?.enabled !== false && !!userId,
    queryFn: async () => {
      const { data = [] } = await audiusSdk!.full.users.getFollowers({
        id: Id.parse(userId),
        limit,
        offset,
        userId: OptionalId.parse(currentUserId)
      })
      return userMetadataListFromSDK(data)
    }
  })
}
