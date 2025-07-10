import { Environment } from '../env'

import { tokenEnvironmentConfig } from './tokenConfigs'
import { TokenConfig, TokenRegistry, SupportedToken } from './types'

/**
 * Implementation of TokenRegistry interface
 */
class TokenRegistryImpl implements TokenRegistry {
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
    return this.tokens
  }

  getEnabledTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.enabled)
  }

  getJupiterEnabledTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.jupiterEnabled && token.enabled)
  }

  getUserbankTokens(): TokenConfig[] {
    return this.tokens.filter((token) => token.hasUserbank && token.enabled)
  }

  getTokenByAddress(address: string): TokenConfig | undefined {
    return this.addressMap.get(address.toLowerCase())
  }
}

/**
 * Singleton instance for token registry
 */
let tokenRegistryInstance: TokenRegistry | null = null

/**
 * Initialize token registry with environment
 */
const initializeTokenRegistry = (environment: Environment): TokenRegistry => {
  tokenRegistryInstance = new TokenRegistryImpl(environment)
  return tokenRegistryInstance
}

/**
 * Get token registry instance
 */
const getTokenRegistry = (): TokenRegistry => {
  if (!tokenRegistryInstance) {
    throw new Error(
      'Token registry not initialized. Call initializeTokenRegistry first.'
    )
  }
  return tokenRegistryInstance
}

export { initializeTokenRegistry, getTokenRegistry }
