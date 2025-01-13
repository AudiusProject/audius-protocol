import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useUsers } from './useUsers'

export const useSuggestedArtists = (options?: QueryOptions) => {
  const { env, fetch } = useAudiusQueryContext()

  const { data: suggestedIds } = useQuery<number[]>({
    queryKey: [QUERY_KEYS.suggestedArtists, 'ids'],
    queryFn: async () => {
      const response = await fetch(env.SUGGESTED_FOLLOW_HANDLES!)
      const suggestedArtists = await response.json()
      // dedupe the artists just in case the team accidentally adds the same artist twice
      return [...new Set(suggestedArtists as number[])]
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false
  })

  return useUsers(suggestedIds, {
    ...options,
    enabled: options?.enabled !== false
  })
}
