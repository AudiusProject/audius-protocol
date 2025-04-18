import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { omit } from 'lodash'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'

import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions, SelectableQueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useUser } from './useUser'
import { primeUserData } from './utils/primeUserData'

export const getUserByHandleQueryKey = (handle: string | null | undefined) => {
  return [QUERY_KEYS.userByHandle, handle] as unknown as QueryKey<ID>
}

export const useUserByHandle = <TResult = User>(
  handle: string | null | undefined,
  options?: SelectableQueryOptions<User, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { data: userId } = useQuery({
    queryKey: getUserByHandleQueryKey(handle),
    queryFn: async () => {
      if (!handle) return null
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getUserByHandle({
        handle: handle.toLowerCase(),
        userId: OptionalId.parse(currentUserId)
      })
      const user = userMetadataListFromSDK(data)[0]

      primeUserData({ users: [user], queryClient, dispatch })
      return user.user_id
    },
    ...(omit(options, 'select') as QueryOptions),
    enabled: options?.enabled !== false && !!handle
  })

  return useUser(userId, {
    select: options?.select
  })
}
