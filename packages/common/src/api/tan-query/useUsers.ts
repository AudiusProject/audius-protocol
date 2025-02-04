import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeUserData } from './utils/primeUserData'

export const getUsersQueryKey = (userIds: ID[] | null | undefined) => [
  QUERY_KEYS.users,
  userIds
]

export const useUsers = (
  userIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const encodedIds = userIds?.map((id) => Id.parse(id)).filter(removeNullable)

  return useQuery({
    queryKey: getUsersQueryKey(userIds),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getBulkUsers({
        id: encodedIds
      })

      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })

      return users
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && encodedIds && encodedIds.length > 0
  })
}
