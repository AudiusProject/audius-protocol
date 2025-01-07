import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { Id } from '../utils'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useSalesCount = (userId: Nullable<ID>, config?: Config) => {
  const context = useAudiusQueryContext()
  const audiusSdk = context.audiusSdk

  return useQuery({
    queryKey: [QUERY_KEYS.salesCount, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = 0 } = await sdk.full.users.getSalesCount({
        id: Id.parse(userId),
        userId: Id.parse(userId)
      })
      return data
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!audiusSdk && !!userId
  })
}
