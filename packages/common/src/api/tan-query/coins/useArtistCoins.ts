import { Id, Coin } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { ID } from '~/models'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils/QueryContext'

export type UseArtistCoinsParams = {
  mint?: string[]
  owner_id?: ID[]
  limit?: number
  offset?: number
}

export const getArtistCoinsQueryKey = (params: UseArtistCoinsParams) =>
  [QUERY_KEYS.coins, 'list', params] as unknown as QueryKey<Coin[]>

export const useArtistCoins = <TResult = Coin[]>(
  params: UseArtistCoinsParams = {},
  options?: SelectableQueryOptions<Coin[], TResult>
) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: getArtistCoinsQueryKey(params),
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
    },
    ...options,
    enabled: options?.enabled !== false
  })
}
