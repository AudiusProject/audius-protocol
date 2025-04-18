import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pick } from 'lodash'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'

import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions, SelectableQueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useUsers } from './useUsers'
import { primeUserData } from './utils/primeUserData'

export const getMutedUsersQueryKey = (currentUserId: ID | null | undefined) => {
  return [QUERY_KEYS.mutedUsers, currentUserId] as unknown as QueryKey<ID[]>
}

export const useMutedUsers = <TResult = UserMetadata[]>(
  options?: SelectableQueryOptions<UserMetadata[], TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const simpleOptions = pick(options, [
    'enabled',
    'staleTime',
    'placeholderData'
  ]) as QueryOptions

  const { data: userIds } = useQuery({
    queryKey: getMutedUsersQueryKey(currentUserId),
    queryFn: async () => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getMutedUsers({
        id: Id.parse(currentUserId)
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users.map((user) => user.user_id)
    },
    ...simpleOptions,
    enabled: simpleOptions?.enabled !== false && !!currentUserId
  })

  return useUsers(userIds, options)
}
