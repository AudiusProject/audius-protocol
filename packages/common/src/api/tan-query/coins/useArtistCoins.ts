import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { ID } from '~/models'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from '../queryKeys'
import { useQueryContext } from '../utils/QueryContext'

export type UseArtistCoinsParams = {
  mint?: string[]
  owner_id?: ID[]
  limit?: number
  offset?: number
}

export const useArtistCoins = (params: UseArtistCoinsParams = {}) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.artistCoins, 'list', params],
    queryFn: async () => {
      const sdk = await audiusSdk()

      // Encode owner_id params to match API expectations
      const encodedOwnerIds = params.owner_id
        ?.map((id) => Id.parse(id))
        .filter(removeNullable)

      const response = await sdk.coins.getCoins({
        mint: params.mint,
        ownerId: encodedOwnerIds,
        limit: params.limit,
        offset: params.offset
      })

      return response?.data
    }
  })
}
