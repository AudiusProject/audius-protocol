import { encodeHashId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'

export type TokenOverview = {
  address: string
  decimals: number
  symbol: string
  name: string
  marketCap: number
  fdv: number
  extensions: {
    coingeckoId: string
    description: string
    twitter: string
    website: string
    discord: string
  }
  logoURI: string
  liquidity: number
  lastTradeUnixTime: number
  lastTradeHumanTime: string
  price: number
  history24hPrice: number
  priceChange24hPercent: number
  uniqueWallet24h: number
  uniqueWalletHistory24h: number
  uniqueWallet24hChangePercent: number
  totalSupply: number
  circulatingSupply: number
  holder: number
  trade24h: number
  tradeHistory24h: number
  trade24hChangePercent: number
  sell24h: number
  sellHistory24h: number
  sell24hChangePercent: number
  buy24h: number
  buyHistory24h: number
  buy24hChangePercent: number
  v24h: number
  v24hUSD: number
  vHistory24h: number
  vHistory24hUSD: number
  v24hChangePercent: number
  vBuy24h: number
  vBuy24hUSD: number
  vBuyHistory24h: number
  vBuyHistory24hUSD: number
  vBuy24hChangePercent: number
  vSell24h: number
  vSell24hUSD: number
  vSellHistory24h: number
  vSellHistory24hUSD: number
  vSell24hChangePercent: number
  numberMarkets: number
}

export type ArtistCoinWithTokenInfo = {
  ticker: string
  mint: string
  owner_id: string
  members: number
  members_24h_change_percent?: number | null
  created_at: string
  token_info?: TokenOverview | null
}

export type UseArtistCoinsParams = {
  mint?: string[]
  owner_id?: ID[]
  limit?: number
  offset?: number
}

// TODO: PE-6542 Replace this with sdk call
export const useArtistCoins = (params: UseArtistCoinsParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.artistCoins, 'list', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.mint) {
        params.mint.forEach((m) => searchParams.append('mint', m))
      }
      if (params.owner_id) {
        params.owner_id.forEach((id) => {
          const encodedId = encodeHashId(id)
          if (encodedId) {
            searchParams.append('owner_id', encodedId)
          }
        })
      }
      if (params.limit) {
        searchParams.append('limit', params.limit.toString())
      }
      if (params.offset) {
        searchParams.append('offset', params.offset.toString())
      }
      const res = await fetch(`https://api.audius.co/v1/coins?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch coins')
      const data = await res.json()
      return data.data as ArtistCoinWithTokenInfo[]
    }
  })
}
