import { HashId, type Coin as CoinSDK } from '@audius/sdk'

import { ID } from '~/models'
import { removeNullable } from '~/utils/typeUtils'

// Define a cleaner coin model without UI dependencies
export type CoinMetadata = {
  mint: string
  ticker: string | null
  logoUri: string | null
  decimals: number | null
}

// Define a full coin model with ownerId converted to number
export type Coin = Omit<CoinSDK, 'ownerId'> & {
  ownerId: ID
}

/**
 * Converts a SDK `Coin` response to internal CoinMetadata
 */
export const coinFromSDK = (input: CoinSDK | Coin): CoinMetadata => ({
  mint: input.mint,
  ticker: input.ticker ?? null,
  logoUri: input.logoUri ?? null,
  decimals: input.decimals ?? null
})

/**
 * Converts a SDK `Coin` response to Coin, parsing ownerId from HashId string to number
 */
export const coinWithParsedOwnerIdFromSDK = (
  input: CoinSDK
): Coin | undefined => {
  const decodedOwnerId = HashId.parse(input.ownerId)
  if (!decodedOwnerId) {
    return undefined
  }

  const { ownerId: _ignored, ...rest } = input
  return {
    ...rest,
    ownerId: decodedOwnerId
  }
}

/**
 * Converts a list of SDK `Coin` responses to CoinMetadata list
 */
export const coinMetadataListFromSDK = (input?: CoinSDK[]): CoinMetadata[] =>
  input ? input.map(coinFromSDK).filter(removeNullable) : []

/**
 * Converts a list of SDK `Coin` responses to Coin list (with parsed ownerId)
 */
export const coinListFromSDK = (input?: CoinSDK[]): Coin[] =>
  input ? input.map(coinWithParsedOwnerIdFromSDK).filter(removeNullable) : []

/**
 * Creates a map of coins keyed by ticker symbol
 */
export const coinMapFromSDK = (
  input?: CoinSDK[]
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
