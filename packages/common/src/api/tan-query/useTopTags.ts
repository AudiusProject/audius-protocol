import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

type UseTopTagsArgs = {
  userId: ID | null | undefined
  limit?: number
}

export const getTopTagsQueryKey = (userId: ID | null | undefined) => [
  QUERY_KEYS.topTags,
  userId
]

export const useTopTags = (
  { userId, limit = 5 }: UseTopTagsArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: getTopTagsQueryKey(userId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.users.getTopTrackTags({
        id: Id.parse(userId),
        limit
      })

      return data
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })
}
