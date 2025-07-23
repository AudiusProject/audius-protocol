import type { ComponentType } from 'react'

import { TokenInfo } from '~/store/ui/buy-sell/types'

import { ArtistCoinWithTokenInfo } from './useArtistCoins'

export const transformArtistCoinToTokenInfo = (
  artistCoin: ArtistCoinWithTokenInfo,
  icon?: ComponentType<any>
): TokenInfo => {
  const tokenInfo = artistCoin.token_info

  return {
    symbol: artistCoin.ticker,
    name: tokenInfo?.name || artistCoin.ticker,
    decimals: tokenInfo?.decimals || 8,
    balance: null, // This would come from user's wallet state
    address: artistCoin.mint,
    icon,
    isStablecoin: artistCoin.ticker === 'USDC'
  }
}

export const transformArtistCoinsToTokenInfoMap = (
  artistCoins: ArtistCoinWithTokenInfo[],
  iconMap: Record<string, ComponentType<any>> = {}
): Record<string, TokenInfo> => {
  const tokenMap: Record<string, TokenInfo> = {}

  artistCoins.forEach((coin) => {
    const icon = iconMap[coin.ticker]
    tokenMap[coin.ticker] = transformArtistCoinToTokenInfo(coin, icon)
  })

  return tokenMap
}

export const getTokenInfoBySymbol = (
  artistCoins: ArtistCoinWithTokenInfo[],
  symbol: string,
  iconMap: Record<string, ComponentType<any>> = {}
): TokenInfo | undefined => {
  const coin = artistCoins.find((c) => c.ticker === symbol)
  if (!coin) return undefined

  const icon = iconMap[symbol]
  return transformArtistCoinToTokenInfo(coin, icon)
}

export const getAllTokenSymbols = (
  artistCoins: ArtistCoinWithTokenInfo[]
): string[] => {
  return artistCoins.map((coin) => coin.ticker)
}

export const getTokenMintsBySymbols = (
  artistCoins: ArtistCoinWithTokenInfo[],
  symbols: string[]
): string[] => {
  return artistCoins
    .filter((coin) => symbols.includes(coin.ticker))
    .map((coin) => coin.mint)
}
