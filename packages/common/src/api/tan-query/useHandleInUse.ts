import { useQuery } from '@tanstack/react-query'
import { isEmpty } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query'
import { AudiusQueryContextType } from '~/audius-query/AudiusQueryContext'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const fetchHandleInUse = async (
  handle: string | null | undefined,
  { audiusSdk }: AudiusQueryContextType
) => {
  if (!handle) return false
  const sdk = await audiusSdk()
  try {
    const { data: users = [] } = await sdk.full.users.getUserByHandle({
      handle
    })
    return !isEmpty(users[0])
  } catch (e: any) {
    if ('response' in e && e.response.status === 404) {
      // Expect not found when handle is available
      return false
    }
    throw e
  }
}

/**
 * Hook to check if a handle is already in use
 */
export const useHandleInUse = (
  handle: string | null | undefined,
  options?: QueryOptions
) => {
  const context = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.handleInUse, handle],
    queryFn: () => fetchHandleInUse(handle, context),
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!handle
  })
}
