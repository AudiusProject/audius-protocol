import { Env } from '~/services/env'

import {
  createTokenListingMap,
  TOKEN_LISTING_MAP
} from '../shared/tokenConstants'

import { TokenInfo, TokenPair } from './types'

// USD-based limits that apply to all currencies
export const MIN_SWAP_AMOUNT_USD = 0.01 // $0.01
export const MAX_SWAP_AMOUNT_USD = 10000 // $10,000

// Create tokens using environment variables
export const createTokens = (env: Env): Record<string, TokenInfo> => {
  const tokenListingMap = createTokenListingMap(env)
  return {
    AUDIO: {
      symbol: 'AUDIO',
      name: 'Audius',
      decimals: tokenListingMap.AUDIO.decimals,
      balance: null,
      isStablecoin: false,
      address: tokenListingMap.AUDIO.address
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: tokenListingMap.USDC.decimals,
      balance: null,
      isStablecoin: true,
      address: tokenListingMap.USDC.address
    }
  }
}

// Token metadata without icons (to avoid circular dependency with harmony)
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

// Create supported token pairs using environment variables
export const createSupportedTokenPairs = (env: Env): TokenPair[] => {
  const tokens = createTokens(env)
  return [
    {
      baseToken: tokens.AUDIO,
      quoteToken: tokens.USDC,
      exchangeRate: null
    }
  ]
}

// Define supported token pairs without icons
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
