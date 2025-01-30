import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

export const getUserByHandleQueryKey = (handle: string | null | undefined) => [
  QUERY_KEYS.userByHandle,
  handle
]

export const useUserByHandle = (
  handle: string | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getUserByHandleQueryKey(handle),
    queryFn: async () => {
      if (!handle) return null
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getUserByHandle({
        handle,
        userId: OptionalId.parse(currentUserId)
      })
      const user = userMetadataListFromSDK(data)[0]

      // Prime the user query cache with user data
      if (user) {
        primeUserData({
          users: [user],
          queryClient,
          dispatch
        })
      }

      return user
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!handle
  })
}
