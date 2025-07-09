/**
 * Token symbol type representing all supported tokens in the Audius protocol
 */
export type SupportedToken = 'AUDIO' | 'USDC' | 'BONK' | 'wAUDIO'

/**
 * Token network type
 */
export type TokenNetwork = 'ethereum' | 'solana'

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
export interface TokenEnvironmentConfig {
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
export interface TokenRegistry {
  /** Get all tokens for current environment */
  getAllTokens(): TokenConfig[]

  /** Get token configuration by symbol */
  getTokenConfig(symbol: SupportedToken): TokenConfig | undefined

  /** Get all enabled tokens */
  getEnabledTokens(): TokenConfig[]

  /** Get all tokens that support userbank */
  getUserbankTokens(): TokenConfig[]

  /** Get all tokens enabled for Jupiter swaps */
  getJupiterEnabledTokens(): TokenConfig[]

  /** Get all purchasable tokens */
  getPurchasableTokens(): TokenConfig[]

  /** Get all sellable tokens */
  getSellableTokens(): TokenConfig[]

  /** Get token by address */
  getTokenByAddress(address: string): TokenConfig | undefined

  /** Get all token addresses */
  getAllTokenAddresses(): string[]

  /** Get all Solana token addresses */
  getSolanaTokenAddresses(): string[]

  /** Get all Ethereum token addresses */
  getEthereumTokenAddresses(): string[]

  /** Check if token is supported */
  isTokenSupported(symbol: string): symbol is SupportedToken

  /** Check if address is a supported token */
  isAddressSupported(address: string): boolean
}

/**
 * Token authority configuration for Solana
 */
export interface TokenAuthority {
  /** Token symbol */
  symbol: SupportedToken
  /** Derived authority public key */
  authority: string
}

/**
 * Token userbank configuration
 */
export interface TokenUserbank {
  /** Token symbol */
  symbol: SupportedToken
  /** Userbank derivation seed */
  seed: string
}
