/**
 * Token configuration for the Solana relay backend
 */

export interface BackendTokenConfig {
  symbol: string
  name: string
  envKey: string
  hasUserbank: boolean
  jupiterEnabled: boolean
  defaultDevAddress: string
  defaultStagingAddress: string
  defaultProdAddress: string
}

/**
 * Backend token configurations
 */
export const backendTokenConfigs: BackendTokenConfig[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    envKey: 'audius_solana_usdc_mint',
    hasUserbank: true,
    jupiterEnabled: true,
    defaultDevAddress: '26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y',
    defaultStagingAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    defaultProdAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  },
  {
    symbol: 'wAUDIO',
    name: 'Wrapped Audius',
    envKey: 'audius_solana_waudio_mint',
    hasUserbank: true,
    jupiterEnabled: true,
    defaultDevAddress: '37RCjhgV1qGV2Q54EHFScdxZ22ydRMdKMtVgod47fDP3',
    defaultStagingAddress: 'BELGiMZQ34SDE6x2FUaML2UHDAgBLS64xvhXjX5tBBZo',
    defaultProdAddress: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    envKey: 'audius_solana_bonk_mint',
    hasUserbank: true,
    jupiterEnabled: true,
    defaultDevAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    defaultStagingAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    defaultProdAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
  }
]

/**
 * Get token configuration by symbol
 */
export const getTokenConfigBySymbol = (symbol: string): BackendTokenConfig | undefined => {
  return backendTokenConfigs.find(config => config.symbol === symbol)
}

/**
 * Get all userbank-enabled tokens
 */
export const getUserbankTokenConfigs = (): BackendTokenConfig[] => {
  return backendTokenConfigs.filter(config => config.hasUserbank)
}

/**
 * Get all Jupiter-enabled tokens
 */
export const getJupiterTokenConfigs = (): BackendTokenConfig[] => {
  return backendTokenConfigs.filter(config => config.jupiterEnabled)
}

/**
 * Get all supported token symbols
 */
export const getSupportedTokenSymbols = (): string[] => {
  return backendTokenConfigs.map(config => config.symbol)
}

/**
 * Get environment variable keys for all tokens
 */
export const getTokenEnvKeys = (): string[] => {
  return backendTokenConfigs.map(config => config.envKey)
}