import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

export const usePurchasesCount = (
  userId: ID | null | undefined,
  config?: Config
) => {
  const context = useAudiusQueryContext()
  const audiusSdk = context.audiusSdk

  return useQuery({
    queryKey: [QUERY_KEYS.purchasesCount, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = 0 } = await sdk.full.users.getPurchasesCount({
        id: Id.parse(userId),
        userId: Id.parse(userId)
      })
      return data
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!audiusSdk && !!userId
  })
}
