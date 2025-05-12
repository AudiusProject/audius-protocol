import { TOKEN_LISTING_MAP } from '@audius/common/store'
import { IconLogoCircleUSDC, IconTokenAUDIO } from '@audius/harmony'

import { TokenInfo, TokenPair } from './types'
// Token metadata
export const TOKENS: Record<string, TokenInfo> = {
  AUDIO: {
    symbol: 'AUDIO',
    name: 'Audius',
    icon: IconTokenAUDIO,
    decimals: TOKEN_LISTING_MAP.AUDIO.decimals,
    balance: null,
    isStablecoin: false
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: IconLogoCircleUSDC,
    decimals: TOKEN_LISTING_MAP.USDC.decimals,
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
