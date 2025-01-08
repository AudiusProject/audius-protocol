import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { AudiusQueryContextType } from '~/audius-query/AudiusQueryContext'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

export const fetchEmailInUse = async (
  email: string | null | undefined,
  { identityService }: AudiusQueryContextType
) => {
  if (!email) return { exists: false, isGuest: false }
  return await identityService.checkIfEmailRegistered(email)
}

/**
 * Hook to check if an email is already registered
 */
export const useEmailInUse = (
  email: string | null | undefined,
  config?: Config
) => {
  const context = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.emailInUse, email],
    queryFn: () => fetchEmailInUse(email, context),
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!email
  })
}
