import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { AudiusQueryContextType } from '~/audius-query/AudiusQueryContext'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const fetchEmailInUse = async (
  email: string | null | undefined,
  { identityService }: AudiusQueryContextType
) => {
  if (!email) return { exists: false, isGuest: false }
  return await identityService.checkIfEmailRegistered(email)
}

export const getEmailInUseQueryKey = (email: string | null | undefined) => [
  QUERY_KEYS.emailInUse,
  email
]

/**
 * Hook to check if an email is already registered
 */
export const useEmailInUse = (
  email: string | null | undefined,
  options?: QueryOptions
) => {
  const context = useAudiusQueryContext()

  return useQuery({
    queryKey: getEmailInUseQueryKey(email),
    queryFn: () => fetchEmailInUse(email, context),
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!email
  })
}
