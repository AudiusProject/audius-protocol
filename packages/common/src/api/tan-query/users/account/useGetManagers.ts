import { useQuery } from '@tanstack/react-query'

import { userManagerListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserManagerMetadata } from '~/models/User'

import { QueryKey } from '../../types'

import { useCurrentUserId } from './useCurrentUserId'

export const getManagersQueryKey = (userId: ID | null | undefined) =>
  ['userManagers', userId] as unknown as QueryKey<UserManagerMetadata[]>

export const useGetManagers = (userId?: ID) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const resolvedUserId = userId ?? currentUserId
  return useQuery<UserManagerMetadata[]>({
    queryKey: getManagersQueryKey(resolvedUserId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const managers = await sdk.full.users.getManagers({
        id: resolvedUserId
      })
      const { data: rawData = [] } = managers
      // Only include approved or pending (not explicitly false)
      const data = rawData.filter((g: any) => g.grant.isApproved !== false)
      return userManagerListFromSDK(data)
    },
    enabled: !!resolvedUserId
  })
}
