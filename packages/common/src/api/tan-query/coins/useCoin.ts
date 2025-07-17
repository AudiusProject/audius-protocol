import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'

export interface CoinInfo {
  ticker: string
  mint: string
  user_id: string
  created_at: string
  members: number
  members_24h_change_percent: number
  token_info: {
    price: number
    price_change_24h: number
    market_cap: number
    volume_24h: number
    supply: number
    holders: number
  }
}

export interface UseCoinArgs {
  mint: string | null | undefined
}

export const getCoinQueryKey = (mint: string | null | undefined) =>
  [QUERY_KEYS.coin, mint] as unknown as QueryKey<CoinInfo>

export const useCoin = ({ mint }: UseCoinArgs, options?: QueryOptions) => {
  const { env } = useQueryContext()

  return useQuery({
    queryKey: getCoinQueryKey(mint),
    queryFn: async (): Promise<CoinInfo> => {
      if (!mint) {
        throw new Error('Mint is required')
      }

      const response = await fetch(`${env.API_URL}/v1/coin/${mint}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch coin info: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    },
    ...options,
    enabled: options?.enabled !== false && !!mint
  })
}
