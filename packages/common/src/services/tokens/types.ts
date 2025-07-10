/**
 * Token symbol type representing all supported tokens in the Audius protocol
 */
export type SupportedToken = 'AUDIO' | 'USDC' | 'BONK' | 'wAUDIO'

/**
 * Token network type
 */
type TokenNetwork = 'ethereum' | 'solana'

/**
 * Configuration for a single token
 */
export interface TokenConfig {
  /** Token symbol */
  symbol: SupportedToken
  /** Token name */
  name: string
  /** Token network */
  network: TokenNetwork
  /** Mint address (Solana) or contract address (Ethereum) */
  address: string
  /** Number of decimal places */
  decimals: number
  /** Whether this token is enabled for trading */
  enabled: boolean
  /** Whether this token can be purchased */
  purchasable: boolean
  /** Whether this token can be sold */
  sellable: boolean
  /** Whether this token supports userbank functionality */
  hasUserbank: boolean
  /** Whether this token is allowed in Jupiter swaps */
  jupiterEnabled: boolean
  /** Logo URL or path */
  logoUrl?: string
  /** Coingecko ID for price data */
  coingeckoId?: string
}

/**
 * Environment-specific token configuration
 */
interface TokenEnvironmentConfig {
  /** Development environment tokens */
  development: TokenConfig[]
  /** Staging environment tokens */
  staging: TokenConfig[]
  /** Production environment tokens */
  production: TokenConfig[]
}

/**
 * Token registry interface for accessing token configurations
 */
interface TokenRegistry {
  /** Get all tokens */
  getAllTokens(): TokenConfig[]

  /** Get all enabled tokens */
  getEnabledTokens(): TokenConfig[]

  /** Get all tokens enabled for Jupiter swaps */
  getJupiterEnabledTokens(): TokenConfig[]

  /** Get all tokens with userbank support */
  getUserbankTokens(): TokenConfig[]

  /** Get token by address */
  getTokenByAddress(address: string): TokenConfig | undefined
}

export type { TokenEnvironmentConfig, TokenRegistry }
