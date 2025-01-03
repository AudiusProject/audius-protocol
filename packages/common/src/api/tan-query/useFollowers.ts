import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { ID, Id } from '~/models/Identifiers'
import { accountSelectors } from '~/store'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'

const { getUserId } = accountSelectors

type GetFollowersArgs = {
  userId?: Nullable<ID>
  limit?: number
  offset?: number
}

/**
 * Hook to fetch followers for a user with pagination support.
 * If no userId is provided, it will use the current user's ID from the store.
 */
export const useFollowers = ({
  userId: providedUserId,
  limit = 10,
  offset = 0
}: GetFollowersArgs) => {
  const { audiusSdk } = useAppContext()
  const currentUserId = useSelector(getUserId)
  const userId = providedUserId ?? currentUserId

  return useQuery({
    queryKey: [QUERY_KEYS.followers, userId, { limit, offset }],
    enabled: !!userId && !!audiusSdk,
    queryFn: async () => {
      const { data = [] } = await audiusSdk!.full.users.getFollowers({
        id: Id.parse(userId),
        limit,
        offset
      })
      return userMetadataListFromSDK(data)
    }
  })
}
