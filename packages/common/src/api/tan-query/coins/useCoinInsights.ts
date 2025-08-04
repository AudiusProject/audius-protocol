import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { useQueryContext } from '../utils'

export interface UseCoinInsightsParams {
  mint: string
}

export const useCoinInsights = (params: UseCoinInsightsParams) => {
  const { audiusSdk } = useQueryContext()
  const { mint } = params

  return useQuery({
    queryKey: [QUERY_KEYS.artistCoins, mint],
    queryFn: async () => {
      const sdk = await audiusSdk()

      const response = await sdk.coins.getCoinInsights({
        mint
      })
      return response.data
    }
  })
}
