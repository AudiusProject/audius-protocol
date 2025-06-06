import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { QueryContextType } from '~/api/tan-query/utils/QueryContext'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'

export const fetchEmailInUse = async (
  email: string | null | undefined,
  { identityService }: QueryContextType
) => {
  if (!email) return { exists: false, isGuest: false }
  return await identityService.checkIfEmailRegistered(email)
}

export const getEmailInUseQueryKey = (email: string | null | undefined) => {
  return [QUERY_KEYS.emailInUse, email] as unknown as QueryKey<{
    exists: boolean
    isGuest: boolean
  }>
}

/**
 * Hook to check if an email is already registered
 */
export const useEmailInUse = <TResult = { exists: boolean; isGuest: boolean }>(
  email: string | null | undefined,
  options?: SelectableQueryOptions<
    { exists: boolean; isGuest: boolean },
    TResult
  >
) => {
  const context = useQueryContext()

  return useQuery({
    queryKey: getEmailInUseQueryKey(email),
    queryFn: () => fetchEmailInUse(email, context),
    ...options,
    enabled: options?.enabled !== false && !!email
  })
}
