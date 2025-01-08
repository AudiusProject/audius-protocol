import { useQuery } from '@tanstack/react-query'
import { isEmpty } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query'
import { AudiusQueryContextType } from '~/audius-query/AudiusQueryContext'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

export const fetchHandleInUse = async (
  handle: string | null | undefined,
  { audiusSdk }: AudiusQueryContextType
) => {
  if (!handle) return false
  const sdk = await audiusSdk()
  const { data: users = [] } = await sdk.full.users.getUserByHandle({
    handle
  })
  return !isEmpty(users[0])
}

/**
 * Hook to check if a handle is already in use
 */
export const useHandleInUse = (
  handle: string | null | undefined,
  config?: Config
) => {
  const context = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.handleInUse, handle],
    queryFn: () => fetchHandleInUse(handle, context),
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!handle
  })
}
