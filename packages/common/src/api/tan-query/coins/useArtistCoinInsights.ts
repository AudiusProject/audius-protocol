import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { useQueryContext } from '../utils'

export interface UseArtistCoinInsightsParams {
  mint: string
}

export const useArtistCoinInsights = (params: UseArtistCoinInsightsParams) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.coinInsights, params.mint],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.coins.getCoinInsights({ mint: params.mint })
      return response.data
    },
    enabled: !!params.mint
  })
}
