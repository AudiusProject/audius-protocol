import { Environment } from '../env'

import { getTokenRegistry, initializeTokenRegistry } from './TokenRegistry'
import { TokenConfig, SupportedToken } from './types'

/**
 * Validate environment string
 */
const validateEnvironment = (env: string): env is Environment => {
  return ['development', 'staging', 'production'].includes(env)
}

/**
 * Convert wAUDIO to AUDIO for UI consistency
 */
const normalizeTokenSymbol = (symbol: SupportedToken): string => {
  return symbol === 'wAUDIO' ? 'AUDIO' : symbol
}

/**
 * Convert TokenConfig to TokenInfo format for UI
 */
export const tokenConfigToTokenInfo = (token: TokenConfig) => ({
  symbol: normalizeTokenSymbol(token.symbol),
  name: token.name,
  decimals: token.decimals,
  balance: null,
  isStablecoin: token.symbol === 'USDC',
  address: token.address
})

/**
 * Generate all possible token pairs from a list of tokens
 */
export const generateTokenPairs = <T>(
  tokens: T[]
): Array<{ baseToken: T; quoteToken: T }> => {
  return tokens.flatMap((baseToken, i) =>
    tokens.slice(i + 1).map((quoteToken) => ({
      baseToken,
      quoteToken,
      exchangeRate: null
    }))
  )
}

/**
 * Get or initialize token registry with environment validation
 */
export const getOrInitializeRegistry = (environment: string) => {
  if (!validateEnvironment(environment)) {
    throw new Error(
      `Invalid environment: ${environment}. Must be development, staging, or production.`
    )
  }

  try {
    // Try to get existing registry first
    return getTokenRegistry()
  } catch {
    // Initialize if not found
    return initializeTokenRegistry(environment)
  }
}

/**
 * Safely get tokens with error handling
 */
export const safeGetTokens = (
  env: { ENVIRONMENT: string },
  filterFn?: (token: TokenConfig) => boolean
) => {
  try {
    const registry = getOrInitializeRegistry(env.ENVIRONMENT)
    const tokens = registry.getEnabledTokens()
    return filterFn ? tokens.filter(filterFn) : tokens
  } catch (error) {
    console.error('Failed to get tokens:', error)
    return []
  }
}

// Cache for token info objects to avoid repeated computation
const tokenInfoCache = new Map<string, Record<string, any>>()

/**
 * Create token info objects with error boundaries and caching
 */
export const createTokenInfoObjects = (env: { ENVIRONMENT: string }) => {
  const cacheKey = env.ENVIRONMENT

  // Return cached result if available
  if (tokenInfoCache.has(cacheKey)) {
    return tokenInfoCache.get(cacheKey)!
  }

  const tokens = safeGetTokens(env)
  const tokenMap: Record<string, any> = {}

  tokens.forEach((token) => {
    try {
      const tokenInfo = tokenConfigToTokenInfo(token)
      tokenMap[tokenInfo.symbol] = tokenInfo
    } catch (error) {
      console.warn(`Failed to convert token ${token.symbol}:`, error)
    }
  })

  // Cache the result
  tokenInfoCache.set(cacheKey, tokenMap)
  return tokenMap
}
