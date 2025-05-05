import { useQuery } from '@tanstack/react-query'

import { managedUserListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { ManagedUserMetadata } from '~/models/User'

import { QueryKey } from '../../types'

import { useCurrentUserId } from './useCurrentUserId'
export const getManagedAccountsQueryKey = (userId: ID | null | undefined) =>
  ['managedAccounts', userId] as unknown as QueryKey<ManagedUserMetadata[]>

export const useGetManagedAccounts = (userId?: ID) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const resolvedUserId = userId ?? currentUserId
  return useQuery<ManagedUserMetadata[]>({
    queryKey: getManagedAccountsQueryKey(resolvedUserId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const managedUsers = await sdk.full.users.getManagedUsers({
        id: resolvedUserId
      })
      const { data = [] } = managedUsers
      return managedUserListFromSDK(data)
    },
    enabled: !!resolvedUserId
  })
}
