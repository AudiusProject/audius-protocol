import { Env } from '~/services/env'
import { getOrInitializeRegistry } from '~/services/tokens'

import { JupiterTokenListing } from '../buy-audio/types'

/**
 * Base token metadata without environment-specific addresses
 */
const BASE_TOKEN_METADATA = {
  AUDIO: {
    chainId: 101,
    symbol: 'AUDIO',
    name: 'Audius (Portal)',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM/logo.png'
  },
  SOL: {
    chainId: 101,
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  USDC: {
    chainId: 101,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  },
  BONK: {
    chainId: 101,
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png'
  }
} as const

/**
 * Creates token listing map using environment variables for addresses
 */
export const createTokenListingMap = (
  env: Env
): Record<string, JupiterTokenListing> => {
  const registry = getOrInitializeRegistry(env.ENVIRONMENT)

  // Get all tokens from registry
  const allTokens = registry.getAllTokens()
  const tokenMap: Record<string, JupiterTokenListing> = {}

  // Add tokens from registry
  allTokens.forEach((token) => {
    const baseMetadata =
      BASE_TOKEN_METADATA[token.symbol as keyof typeof BASE_TOKEN_METADATA]
    if (baseMetadata) {
      tokenMap[token.symbol] = {
        ...baseMetadata,
        address: token.address,
        decimals: token.decimals
      }
    }
  })

  // Add SOL which is not in the token registry
  tokenMap.SOL = {
    ...BASE_TOKEN_METADATA.SOL
  }

  return tokenMap
}

/**
 * Legacy token listing map with hardcoded addresses for backward compatibility
 */
export const TOKEN_LISTING_MAP: Record<string, JupiterTokenListing> = {
  AUDIO: {
    ...BASE_TOKEN_METADATA.AUDIO,
    address: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'
  },
  SOL: {
    ...BASE_TOKEN_METADATA.SOL
  },
  USDC: {
    ...BASE_TOKEN_METADATA.USDC,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  },
  BONK: {
    ...BASE_TOKEN_METADATA.BONK,
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
  }
}
