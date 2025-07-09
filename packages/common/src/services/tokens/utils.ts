import { PublicKey } from '@solana/web3.js'

import { Environment } from '../env'

import { getTokenRegistry, initializeTokenRegistry } from './TokenRegistry'
import { TokenConfig, SupportedToken } from './types'

/**
 * Validate environment string
 */
export const validateEnvironment = (env: string): env is Environment => {
  return ['development', 'staging', 'production'].includes(env)
}

/**
 * Convert wAUDIO to AUDIO for UI consistency
 */
export const normalizeTokenSymbol = (symbol: SupportedToken): string => {
  return symbol === 'wAUDIO' ? 'AUDIO' : symbol
}

/**
 * Convert AUDIO back to wAUDIO for backend operations
 */
export const denormalizeTokenSymbol = (symbol: string): SupportedToken => {
  return symbol === 'AUDIO' ? 'wAUDIO' : (symbol as SupportedToken)
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

/**
 * Clear token cache (useful for testing or configuration changes)
 */
export const clearTokenCache = () => {
  tokenInfoCache.clear()
}

/**
 * Derive token authority public key for Solana tokens
 */
export const deriveTokenAuthority = (
  tokenAddress: string,
  claimableTokenProgramId: string
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [new PublicKey(tokenAddress).toBytes().slice(0, 32)],
    new PublicKey(claimableTokenProgramId)
  )[0]
}

/**
 * Derive user bank address for a token
 */
export const deriveUserBank = async (
  ethAddress: string,
  tokenAuthority: PublicKey,
  tokenProgramId: PublicKey
): Promise<PublicKey> => {
  const ethAddressArray = Uint8Array.from(
    Buffer.from(ethAddress.substring(2), 'hex')
  )
  const bs58 = await import('bs58')
  return await PublicKey.createWithSeed(
    tokenAuthority,
    bs58.default.encode(ethAddressArray),
    tokenProgramId
  )
}

/**
 * Get all token authorities for userbank-enabled tokens
 */
export const getTokenAuthorities = (
  claimableTokenProgramId: string
): Record<SupportedToken, PublicKey> => {
  const registry = getTokenRegistry()
  const userbankTokens = registry.getUserbankTokens()
  const authorities: Partial<Record<SupportedToken, PublicKey>> = {}

  userbankTokens.forEach((token) => {
    authorities[token.symbol] = deriveTokenAuthority(
      token.address,
      claimableTokenProgramId
    )
  })

  return authorities as Record<SupportedToken, PublicKey>
}

/**
 * Get all mint addresses for allowed tokens
 */
export const getAllowedMintAddresses = (
  includeNativeMint: boolean = true
): string[] => {
  const registry = getTokenRegistry()
  const enabledTokens = registry.getEnabledTokens()
  const addresses = enabledTokens.map((token) => token.address)

  if (includeNativeMint) {
    // Add native SOL mint
    addresses.push('So11111111111111111111111111111111111111112')
  }

  return addresses
}

/**
 * Get Jupiter-enabled token addresses
 */
export const getJupiterAllowedAddresses = (): {
  sourceMints: string[]
  destinationMints: string[]
} => {
  const registry = getTokenRegistry()
  const jupiterTokens = registry.getJupiterEnabledTokens()
  const addresses = jupiterTokens.map((token) => token.address)

  // Add native SOL mint for Jupiter swaps
  const nativeMint = 'So11111111111111111111111111111111111111112'
  addresses.push(nativeMint)

  return {
    sourceMints: addresses,
    destinationMints: addresses
  }
}

/**
 * Get token configuration by address
 */
export const getTokenConfigByAddress = (
  address: string
): TokenConfig | undefined => {
  const registry = getTokenRegistry()
  return registry.getTokenByAddress(address)
}

/**
 * Validate if an address is a supported token
 */
export const validateTokenAddress = (address: string): boolean => {
  const registry = getTokenRegistry()
  return registry.isAddressSupported(address)
}

/**
 * Get userbank token configurations
 */
export const getUserbankTokenConfigs = (): TokenConfig[] => {
  const registry = getTokenRegistry()
  return registry.getUserbankTokens()
}

/**
 * Get token symbol by address
 */
export const getTokenSymbolByAddress = (
  address: string
): SupportedToken | undefined => {
  const config = getTokenConfigByAddress(address)
  return config?.symbol
}

/**
 * Check if token supports Jupiter swaps
 */
export const isTokenJupiterEnabled = (symbol: SupportedToken): boolean => {
  const registry = getTokenRegistry()
  const config = registry.getTokenConfig(symbol)
  return config?.jupiterEnabled ?? false
}
