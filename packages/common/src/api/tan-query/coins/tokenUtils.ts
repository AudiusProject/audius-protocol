import type { ComponentType } from 'react'

import type { Coin } from '@audius/sdk'

import { TokenInfo } from '~/store/ui/buy-sell/types'

export const transformArtistCoinToTokenInfo = (
  artistCoin: Coin,
  icon?: ComponentType<any>
): TokenInfo => {
  const tokenInfo = artistCoin.tokenInfo

  return {
    symbol: artistCoin.ticker || '',
    name: tokenInfo?.name || artistCoin.ticker || '',
    decimals: tokenInfo?.decimals || 8,
    balance: null, // This would come from user's wallet state
    address: artistCoin.mint,
    icon,
    logoURI: tokenInfo?.logoURI,
    isStablecoin: false // API tokens are never stablecoins, only USDC is (which is frontend-only)
  }
}

export const transformArtistCoinsToTokenInfoMap = (
  artistCoins: Coin[],
  iconMap: Record<string, ComponentType<any>> = {}
): Record<string, TokenInfo> => {
  const tokenMap: Record<string, TokenInfo> = {}

  artistCoins.forEach((coin) => {
    const ticker = coin.ticker || ''
    const icon = iconMap[ticker]
    tokenMap[ticker] = transformArtistCoinToTokenInfo(coin, icon)
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

  const icon = iconMap[symbol]
  return transformArtistCoinToTokenInfo(coin, icon)
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
