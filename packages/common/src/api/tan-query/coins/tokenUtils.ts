import type { Coin } from '@audius/sdk'

import { coinFromSDK, type CoinMetadata } from '~/adapters'
import { TokenInfo } from '~/store/ui/buy-sell/types'

/**
 * Transform a CoinMetadata to TokenInfo for UI use
 */
const coinMetadataToTokenInfo = (coin: CoinMetadata): TokenInfo => ({
  symbol: coin.ticker ?? '',
  name: coin.ticker ?? '',
  decimals: coin.decimals ?? 8,
  balance: null, // This would come from user's wallet state
  address: coin.mint,
  logoURI: coin.logoUri ?? '',
  isStablecoin: false // API tokens are never stablecoins, only USDC is (which is frontend-only)
})

export const transformArtistCoinToTokenInfo = (artistCoin: Coin): TokenInfo => {
  const coinMetadata = coinFromSDK(artistCoin)
  return coinMetadataToTokenInfo(coinMetadata)
}

export const transformArtistCoinsToTokenInfoMap = (
  artistCoins: Coin[]
): Record<string, TokenInfo> => {
  const tokenMap: Record<string, TokenInfo> = {}

  artistCoins.forEach((coin) => {
    const coinMetadata = coinFromSDK(coin)
    const ticker = coinMetadata.ticker || ''
    if (ticker) {
      tokenMap[ticker] = coinMetadataToTokenInfo(coinMetadata)
    }
  })

  return tokenMap
}

export const getTokenInfoBySymbol = (
  artistCoins: Coin[],
  symbol: string
): TokenInfo | undefined => {
  const coin = artistCoins.find((c) => c.ticker === symbol)
  if (!coin) return undefined

  const coinMetadata = coinFromSDK(coin)
  return coinMetadataToTokenInfo(coinMetadata)
}

export const getAllTokenSymbols = (artistCoins: Coin[]): string[] => {
  return artistCoins.map((coin) => coin.ticker || '')
}

export const getTokenMintsBySymbols = (
  artistCoins: Coin[],
  symbols: string[]
): string[] => {
  return artistCoins
    .filter((coin) => coin.ticker && symbols.includes(coin.ticker))
    .map((coin) => coin.mint)
}
