import { AuthorizedApp, Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { SelectableQueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const getAuthorizedAppsQueryKey = (userId: Nullable<ID>) => [
  QUERY_KEYS.authorizedApps,
  userId
]

export const useAuthorizedApps = <TResult = AuthorizedApp[]>(
  options?: SelectableQueryOptions<AuthorizedApp[], TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: userId } = useCurrentUserId()

  return useQuery({
    queryKey: getAuthorizedAppsQueryKey(userId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.users.getAuthorizedApps({
        id: Id.parse(userId)
      })

      return data
    },
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
