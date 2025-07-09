import { Env } from '~/services/env'
import {
  createTokenInfoObjects,
  generateTokenPairs,
  safeGetTokens,
  tokenConfigToTokenInfo
} from '~/services/tokens'

import { TOKEN_LISTING_MAP } from '../shared/tokenConstants'

import { TokenInfo, TokenPair } from './types'

// USD-based limits that apply to all currencies
export const MIN_SWAP_AMOUNT_USD = 0.01 // $0.01
export const MAX_SWAP_AMOUNT_USD = 10000 // $10,000

// Create tokens using environment variables
export const createTokens = (env: Env): Record<string, TokenInfo> => {
  return createTokenInfoObjects(env)
}

// Legacy token metadata without icons (prefer createTokens)
// @deprecated Use createTokens(env) instead for environment-specific tokens
export const TOKENS: Record<string, TokenInfo> = {
  AUDIO: {
    symbol: 'AUDIO',
    name: 'Audius',
    decimals: TOKEN_LISTING_MAP.AUDIO.decimals,
    balance: null,
    isStablecoin: false,
    address: TOKEN_LISTING_MAP.AUDIO.address
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: TOKEN_LISTING_MAP.USDC.decimals,
    balance: null,
    isStablecoin: true,
    address: TOKEN_LISTING_MAP.USDC.address
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    decimals: TOKEN_LISTING_MAP.BONK.decimals,
    balance: null,
    isStablecoin: false,
    address: TOKEN_LISTING_MAP.BONK.address
  }
}

// Cache for token pairs to avoid repeated computation
const tokenPairsCache = new Map<string, TokenPair[]>()

/**
 * Clear token pairs cache (useful for testing or configuration changes)
 */
export const clearTokenPairsCache = () => {
  tokenPairsCache.clear()
}

// Create supported token pairs using environment variables
export const createSupportedTokenPairs = (env: Env): TokenPair[] => {
  const cacheKey = env.ENVIRONMENT

  // Return cached result if available
  if (tokenPairsCache.has(cacheKey)) {
    return tokenPairsCache.get(cacheKey)!
  }

  // Get all tradeable tokens (purchasable and sellable)
  const tradeableTokens = safeGetTokens(
    env,
    (token) => token.purchasable || token.sellable
  ).map(tokenConfigToTokenInfo)

  // Generate all possible pairs efficiently
  const pairs = generateTokenPairs(tradeableTokens) as TokenPair[]

  // Cache the result
  tokenPairsCache.set(cacheKey, pairs)
  return pairs
}

// Legacy hardcoded supported token pairs (prefer createSupportedTokenPairs)
// @deprecated Use createSupportedTokenPairs(env) instead for dynamic token pairs
export const SUPPORTED_TOKEN_PAIRS: TokenPair[] = [
  {
    baseToken: TOKENS.AUDIO,
    quoteToken: TOKENS.USDC,
    exchangeRate: null
  },
  {
    baseToken: TOKENS.AUDIO,
    quoteToken: TOKENS.BONK,
    exchangeRate: null
  },
  {
    baseToken: TOKENS.USDC,
    quoteToken: TOKENS.BONK,
    exchangeRate: null
  }
]
