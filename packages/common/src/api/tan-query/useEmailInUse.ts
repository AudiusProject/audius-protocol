import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

export const useEmailInUse = (
  email: string | null | undefined,
  config?: Config
) => {
  const { identityService } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.emailInUse, email],
    queryFn: async () => {
      if (!email) return false
      return await identityService.checkIfEmailRegistered(email)
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!email
  })
}
