import { TOKENS as BASE_TOKENS } from '@audius/common/src/store/ui/buy-sell'
import {
  TokenInfo,
  TokenPair
} from '@audius/common/src/store/ui/buy-sell/types'
import {
  IconLogoCircleUSDC,
  IconTokenAUDIO,
  IconLogoCircleSOL
} from '@audius/harmony'

// Token metadata with icons for web
export const TOKENS: Record<string, TokenInfo> = {
  AUDIO: {
    ...BASE_TOKENS.AUDIO,
    icon: IconTokenAUDIO
  },
  USDC: {
    ...BASE_TOKENS.USDC,
    icon: IconLogoCircleUSDC
  },
  TRUMP: {
    ...BASE_TOKENS.TRUMP,
    icon: IconLogoCircleSOL // Using SOL icon as placeholder for TRUMP
  }
}

// Define supported token pairs with icons for web
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
