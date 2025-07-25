import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { useQueryContext } from '../utils'

export interface UseArtistCoinParams {
  mint: string
}

export const useArtistCoin = (params: UseArtistCoinParams) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.coin, params.mint],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.coins.getCoin({ mint: params.mint })
      return response.data
    },
    enabled: !!params.mint
  })
}
