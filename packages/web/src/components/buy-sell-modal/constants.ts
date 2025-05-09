import { IconLogoCircle, IconLogoCircleUSDC } from '@audius/harmony'

import { TokenInfo, TokenPair } from './types'

// Token metadata
export const TOKENS: Record<string, TokenInfo> = {
  AUDIO: {
    symbol: 'AUDIO',
    name: 'Audius',
    icon: IconLogoCircle,
    decimals: 18,
    balance: null,
    isStablecoin: false
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: IconLogoCircleUSDC,
    decimals: 6,
    balance: null,
    isStablecoin: true
  }
}

// Define supported token pairs
export const SUPPORTED_TOKEN_PAIRS: TokenPair[] = [
  {
    baseToken: TOKENS.AUDIO,
    quoteToken: TOKENS.USDC,
    exchangeRate: null
  }
]
