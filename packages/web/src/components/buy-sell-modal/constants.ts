import { TOKENS as BASE_TOKENS } from '@audius/common/src/store/ui/buy-sell'
import {
  TokenInfo,
  TokenPair
} from '@audius/common/src/store/ui/buy-sell/types'
import { IconLogoCircleUSDC, IconTokenAUDIO } from '@audius/harmony'

// Token metadata with icons for web
export const TOKENS: Record<string, TokenInfo> = {
  AUDIO: {
    ...BASE_TOKENS.AUDIO,
    icon: IconTokenAUDIO
  },
  USDC: {
    ...BASE_TOKENS.USDC,
    icon: IconLogoCircleUSDC
  }
}

// Define supported token pairs with icons for web
export const SUPPORTED_TOKEN_PAIRS: TokenPair[] = [
  {
    baseToken: TOKENS.AUDIO,
    quoteToken: TOKENS.USDC,
    exchangeRate: null
  }
]
