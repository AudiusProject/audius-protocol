import { TokenConfig, TokenEnvironmentConfig } from './types'

/**
 * Development environment token configurations
 */
const developmentTokens: TokenConfig[] = [
  {
    symbol: 'AUDIO',
    name: 'Audius',
    network: 'ethereum',
    address: '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998', // Dev AUDIO token
    decimals: 18,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: false,
    jupiterEnabled: false,
    logoUrl: '/img/tokenLogos/audio.svg',
    coingeckoId: 'audius'
  },
  {
    symbol: 'wAUDIO',
    name: 'Wrapped Audius',
    network: 'solana',
    address: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM',
    decimals: 8,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/audio.svg',
    coingeckoId: 'audius'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'solana',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/usdc.svg',
    coingeckoId: 'usd-coin'
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    network: 'solana',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/bonk.svg',
    coingeckoId: 'bonk'
  }
]

/**
 * Staging environment token configurations
 */
const stagingTokens: TokenConfig[] = [
  {
    symbol: 'AUDIO',
    name: 'Audius',
    network: 'ethereum',
    address: '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998', // Staging AUDIO token
    decimals: 18,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: false,
    jupiterEnabled: false,
    logoUrl: '/img/tokenLogos/audio.svg',
    coingeckoId: 'audius'
  },
  {
    symbol: 'wAUDIO',
    name: 'Wrapped Audius',
    network: 'solana',
    address: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM',
    decimals: 8,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/audio.svg',
    coingeckoId: 'audius'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'solana',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/usdc.svg',
    coingeckoId: 'usd-coin'
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    network: 'solana',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/bonk.svg',
    coingeckoId: 'bonk'
  }
]

/**
 * Production environment token configurations
 */
const productionTokens: TokenConfig[] = [
  {
    symbol: 'AUDIO',
    name: 'Audius',
    network: 'ethereum',
    address: '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998',
    decimals: 18,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: false,
    jupiterEnabled: false,
    logoUrl: '/img/tokenLogos/audio.svg',
    coingeckoId: 'audius'
  },
  {
    symbol: 'wAUDIO',
    name: 'Wrapped Audius',
    network: 'solana',
    address: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM',
    decimals: 8,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/audio.svg',
    coingeckoId: 'audius'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'solana',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/usdc.svg',
    coingeckoId: 'usd-coin'
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    network: 'solana',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    enabled: true,
    purchasable: true,
    sellable: true,
    hasUserbank: true,
    jupiterEnabled: true,
    logoUrl: '/img/tokenLogos/bonk.svg',
    coingeckoId: 'bonk'
  }
]

/**
 * Token environment configuration
 */
export const tokenEnvironmentConfig: TokenEnvironmentConfig = {
  development: developmentTokens,
  staging: stagingTokens,
  production: productionTokens
}
