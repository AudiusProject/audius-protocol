import { TOKEN_LISTING_MAP } from '../buy-audio/constants'

import { TokenInfo, TokenPair } from './types'

// USD-based limits that apply to all currencies
export const MIN_SWAP_AMOUNT_USD = 0.01 // $0.01
export const MAX_SWAP_AMOUNT_USD = 10000 // $10,000

// Token metadata without icons (to avoid circular dependency with harmony)
export const TOKENS: Record<string, TokenInfo> = {
  AUDIO: {
    symbol: TOKEN_LISTING_MAP.AUDIO.symbol,
    name: 'Audius',
    decimals: TOKEN_LISTING_MAP.AUDIO.decimals,
    balance: null,
    isStablecoin: false,
    address: TOKEN_LISTING_MAP.AUDIO.address
  },
  USDC: {
    symbol: TOKEN_LISTING_MAP.USDC.symbol,
    name: TOKEN_LISTING_MAP.USDC.name,
    decimals: TOKEN_LISTING_MAP.USDC.decimals,
    balance: null,
    isStablecoin: true,
    address: TOKEN_LISTING_MAP.USDC.address
  }
}

// Define supported token pairs without icons
export const SUPPORTED_TOKEN_PAIRS: TokenPair[] = [
  {
    baseToken: TOKENS.AUDIO,
    quoteToken: TOKENS.USDC,
    exchangeRate: null
  }
]
