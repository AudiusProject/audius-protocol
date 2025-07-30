import type { Coin } from '@audius/sdk'

import { removeNullable } from '~/utils/typeUtils'

// Define a cleaner coin model without UI dependencies
export type CoinMetadata = {
  mint: string
  ticker: string | null
  tokenInfo: {
    name: string | null
    decimals: number | null
    logoURI: string | null
  } | null
}

/**
 * Converts a SDK `Coin` response to internal CoinMetadata
 */
export const coinFromSDK = (input: Coin): CoinMetadata => ({
  mint: input.mint,
  ticker: input.ticker ?? null,
  tokenInfo: input.tokenInfo
    ? {
        name: input.tokenInfo.name ?? null,
        decimals: input.tokenInfo.decimals ?? null,
        logoURI: input.tokenInfo.logoURI ?? null
      }
    : null
})

/**
 * Converts a list of SDK `Coin` responses to CoinMetadata list
 */
export const coinListFromSDK = (input?: Coin[]): CoinMetadata[] =>
  input ? input.map(coinFromSDK).filter(removeNullable) : []

/**
 * Creates a map of coins keyed by ticker symbol
 */
export const coinMapFromSDK = (
  input?: Coin[]
): Record<string, CoinMetadata> => {
  const coinMap: Record<string, CoinMetadata> = {}

  if (input) {
    input.forEach((coin) => {
      const coinMetadata = coinFromSDK(coin)
      if (coinMetadata.ticker) {
        coinMap[coinMetadata.ticker] = coinMetadata
      }
    })
  }

  return coinMap
}

/**
 * Gets all token symbols from a list of coins
 */
export const getTokenSymbolsFromCoins = (coins: CoinMetadata[]): string[] =>
  coins.map((coin) => coin.ticker || '').filter(Boolean)

/**
 * Gets token mints by symbol from a list of coins
 */
export const getTokenMintsBySymbolsFromCoins = (
  coins: CoinMetadata[],
  symbols: string[]
): string[] =>
  coins
    .filter((coin) => coin.ticker && symbols.includes(coin.ticker))
    .map((coin) => coin.mint)
