import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { supportedUserMetadataListFromSDK } from '~/models/Tipping'
import { SUPPORTING_PAGINATION_SIZE } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseSupportedUsersArgs = {
  userId: ID | null | undefined
  limit?: number
}

export const useSupportedUsers = (
  { userId, limit = SUPPORTING_PAGINATION_SIZE }: UseSupportedUsersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.supportedUsers, userId],
    queryFn: async () => {
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
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })
}
