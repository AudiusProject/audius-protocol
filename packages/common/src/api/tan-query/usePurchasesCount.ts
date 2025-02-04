import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export type UsePurchasesCountArgs = {
  userId: ID | null | undefined
}

export const getPurchasesCountQueryKey = ({
  userId
}: UsePurchasesCountArgs) => [QUERY_KEYS.purchasesCount, userId]

export const usePurchasesCount = (
  { userId }: UsePurchasesCountArgs,
  options?: QueryOptions
) => {
  const context = useAudiusQueryContext()
  const audiusSdk = context.audiusSdk

  return useQuery({
    queryKey: getPurchasesCountQueryKey({ userId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = 0 } = await sdk.full.users.getPurchasesCount({
        id: Id.parse(userId),
        userId: Id.parse(userId)
      })
      return data
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!audiusSdk && !!userId
  })
}
