import { Environment } from '../env'

import { tokenEnvironmentConfig } from './tokenConfigs'
import { TokenConfig, TokenRegistry, SupportedToken } from './types'

/**
 * Implementation of TokenRegistry interface
 */
export class TokenRegistryImpl implements TokenRegistry {
  private tokens: TokenConfig[]
  private tokenMap: Map<SupportedToken, TokenConfig>
  private addressMap: Map<string, TokenConfig>

  constructor(environment: Environment) {
    this.tokens = tokenEnvironmentConfig[environment]
    this.tokenMap = new Map()
    this.addressMap = new Map()

    // Build lookup maps for performance
    this.tokens.forEach((token) => {
      this.tokenMap.set(token.symbol, token)
      this.addressMap.set(token.address.toLowerCase(), token)
    })
  }

  getAllTokens(): TokenConfig[] {
    return [...this.tokens]
  }

  getTokenConfig(symbol: SupportedToken): TokenConfig | undefined {
    return this.tokenMap.get(symbol)
  }

  getEnabledTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.enabled)
  }

  getUserbankTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.hasUserbank && token.enabled)
  }

  getJupiterEnabledTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.jupiterEnabled && token.enabled)
  }

  getPurchasableTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.purchasable && token.enabled)
  }

  getSellableTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.sellable && token.enabled)
  }

  getTokenByAddress(address: string): TokenConfig | undefined {
    return this.addressMap.get(address.toLowerCase())
  }

  getAllTokenAddresses(): string[] {
    return this.tokens.map((token) => token.address)
  }

  getSolanaTokenAddresses(): string[] {
    return this.tokens
      .filter((token) => token.network === 'solana')
      .map((token) => token.address)
  }

  getEthereumTokenAddresses(): string[] {
    return this.tokens
      .filter((token) => token.network === 'ethereum')
      .map((token) => token.address)
  }

  isTokenSupported(symbol: string): symbol is SupportedToken {
    return this.tokenMap.has(symbol as SupportedToken)
  }

  isAddressSupported(address: string): boolean {
    return this.addressMap.has(address.toLowerCase())
  }
}

/**
 * Singleton instance for token registry
 */
let tokenRegistryInstance: TokenRegistry | null = null

/**
 * Initialize token registry with environment
 */
export const initializeTokenRegistry = (
  environment: Environment
): TokenRegistry => {
  tokenRegistryInstance = new TokenRegistryImpl(environment)
  return tokenRegistryInstance
}

/**
 * Get token registry instance
 */
export const getTokenRegistry = (): TokenRegistry => {
  if (!tokenRegistryInstance) {
    throw new Error(
      'Token registry not initialized. Call initializeTokenRegistry first.'
    )
  }
  return tokenRegistryInstance
}

/**
 * Helper function to get token config by symbol
 */
export const getTokenConfig = (
  symbol: SupportedToken
): TokenConfig | undefined => {
  return getTokenRegistry().getTokenConfig(symbol)
}

/**
 * Helper function to get token address by symbol
 */
export const getTokenAddress = (symbol: SupportedToken): string | undefined => {
  return getTokenConfig(symbol)?.address
}

/**
 * Helper function to get token decimals by symbol
 */
export const getTokenDecimals = (
  symbol: SupportedToken
): number | undefined => {
  return getTokenConfig(symbol)?.decimals
}

/**
 * Helper function to check if token has userbank
 */
export const hasTokenUserbank = (symbol: SupportedToken): boolean => {
  return getTokenConfig(symbol)?.hasUserbank ?? false
}

/**
 * Helper function to check if token is Jupiter enabled
 */
export const isJupiterEnabled = (symbol: SupportedToken): boolean => {
  return getTokenConfig(symbol)?.jupiterEnabled ?? false
}
