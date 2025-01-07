import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { Id, OptionalId } from '~/models/Identifiers'
import { supportedUserMetadataListFromSDK } from '~/models/Tipping'
import { SUPPORTING_PAGINATION_SIZE } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseSupportedUsersArgs = {
  userId?: number
  limit?: number
}

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useSupportedUsers = (
  { userId, limit = SUPPORTING_PAGINATION_SIZE }: UseSupportedUsersArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.supportedUsers, userId],
    queryFn: async () => {
      if (!userId) return []
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getSupportedUsers({
        id: Id.parse(userId),
        limit,
        userId: OptionalId.parse(currentUserId)
      })

      const supporting = supportedUserMetadataListFromSDK(data)

      // Cache user data for each supported user
      primeUserData({
        users: supporting.map((supportedUser) => supportedUser.receiver),
        queryClient,
        dispatch
      })

      return supporting
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })
}
