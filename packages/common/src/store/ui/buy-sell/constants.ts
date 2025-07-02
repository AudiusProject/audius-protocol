import { TOKEN_LISTING_MAP } from '../buy-audio/constants'

import { TokenInfo, TokenPair } from './types'

// USD-based limits that apply to all currencies
export const MIN_SWAP_AMOUNT_USD = 0.01 // $0.01
export const MAX_SWAP_AMOUNT_USD = 10000 // $10,000

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
  TRUMP: {
    symbol: 'TRUMP',
    name: 'OFFICIAL TRUMP',
    decimals: TOKEN_LISTING_MAP.TRUMP.decimals,
    balance: null,
    isStablecoin: false,
    address: TOKEN_LISTING_MAP.TRUMP.address
  }
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
    quoteToken: TOKENS.TRUMP,
    exchangeRate: null
  },
  {
    baseToken: TOKENS.USDC,
    quoteToken: TOKENS.TRUMP,
    exchangeRate: null
  }
]
