import { Env } from '~/services/env'
import {
  createTokenInfoObjects,
  generateTokenPairs,
  safeGetTokens,
  tokenConfigToTokenInfo
} from '~/services/tokens'

import { TokenInfo, TokenPair } from './types'

// USD-based limits that apply to all currencies
export const MIN_SWAP_AMOUNT_USD = 0.01 // $0.01
export const MAX_SWAP_AMOUNT_USD = 10000 // $10,000

// Create tokens using environment variables
export const createTokens = (env: Env): Record<string, TokenInfo> => {
  return createTokenInfoObjects(env)
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

  // Find specific tokens for explicit ordering
  const audioToken = tradeableTokens.find((token) => token.symbol === 'AUDIO')
  const usdcToken = tradeableTokens.find((token) => token.symbol === 'USDC')

  // Create pairs with explicit ordering to ensure USDC -> AUDIO is first
  const pairs: TokenPair[] = []

  // First pair: AUDIO/USDC (for Buy: USDC -> AUDIO, Sell: AUDIO -> USDC)
  if (audioToken && usdcToken) {
    pairs.push({
      baseToken: audioToken,
      quoteToken: usdcToken,
      exchangeRate: null
    })
  }

  // Generate remaining pairs, excluding the AUDIO/USDC pair we already added
  const remainingPairs = generateTokenPairs(tradeableTokens).filter(
    (pair) =>
      !(pair.baseToken.symbol === 'AUDIO' && pair.quoteToken.symbol === 'USDC')
  ) as TokenPair[]

  pairs.push(...remainingPairs)

  // Cache the result
  tokenPairsCache.set(cacheKey, pairs)
  return pairs
}
