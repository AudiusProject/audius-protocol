import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

export const getMutedUsersQueryKey = (currentUserId: ID | null | undefined) => [
  QUERY_KEYS.mutedUsers,
  currentUserId
]

export const useMutedUsers = (options?: QueryOptions) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: getMutedUsersQueryKey(currentUserId),
    queryFn: async () => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getMutedUsers({
        id: Id.parse(currentUserId)
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
