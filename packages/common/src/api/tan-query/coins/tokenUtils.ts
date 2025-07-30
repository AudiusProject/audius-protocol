import type { ComponentType } from 'react'

import type { Coin } from '@audius/sdk'

import { coinFromSDK, type CoinMetadata } from '~/adapters'
import { TokenInfo } from '~/store/ui/buy-sell/types'

/**
 * Transform a CoinMetadata to TokenInfo for UI use
 */
const coinMetadataToTokenInfo = (
  coin: CoinMetadata,
  icon?: ComponentType<any>
): TokenInfo => ({
  symbol: coin.ticker ?? '',
  name: coin.tokenInfo?.name ?? coin.ticker ?? '',
  decimals: coin.tokenInfo?.decimals ?? 8,
  balance: null, // This would come from user's wallet state
  address: coin.mint,
  icon,
  logoURI: coin.tokenInfo?.logoURI ?? '',
  isStablecoin: false // API tokens are never stablecoins, only USDC is (which is frontend-only)
})

export const transformArtistCoinToTokenInfo = (
  artistCoin: Coin,
  icon?: ComponentType<any>
): TokenInfo => {
  const coinMetadata = coinFromSDK(artistCoin)
  return coinMetadataToTokenInfo(coinMetadata, icon)
}

export const transformArtistCoinsToTokenInfoMap = (
  artistCoins: Coin[],
  iconMap: Record<string, ComponentType<any>> = {}
): Record<string, TokenInfo> => {
  const tokenMap: Record<string, TokenInfo> = {}

  artistCoins.forEach((coin) => {
    const coinMetadata = coinFromSDK(coin)
    const ticker = coinMetadata.ticker || ''
    const icon = iconMap[ticker]
    if (ticker) {
      tokenMap[ticker] = coinMetadataToTokenInfo(coinMetadata, icon)
    }
  })

  return tokenMap
}

export const getTokenInfoBySymbol = (
  artistCoins: Coin[],
  symbol: string,
  iconMap: Record<string, ComponentType<any>> = {}
): TokenInfo | undefined => {
  const coin = artistCoins.find((c) => c.ticker === symbol)
  if (!coin) return undefined

  const coinMetadata = coinFromSDK(coin)
  const icon = iconMap[symbol]
  return coinMetadataToTokenInfo(coinMetadata, icon)
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
