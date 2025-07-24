import { encodeHashId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { useQueryContext } from '../utils'

export type UseArtistCoinParams = {
  mint?: string[]
  owner_id?: ID[]
}

export const useArtistCoin = (params: UseArtistCoinParams = {}) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.artistCoins, params],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const searchParams: any = {}
      if (params.mint) {
        searchParams.mint = params.mint
      }
      if (params.owner_id) {
        searchParams.ownerId = params.owner_id.map((id) => {
          const encodedId = encodeHashId(id)
          return encodedId || id.toString()
        })
      }

      const response = await sdk.coins.getCoins(searchParams)
      return response.data
    }
  })
}
