import {
  createTokens,
  createSupportedTokenPairs
} from '@audius/common/src/store/ui/buy-sell'
import {
  TokenInfo,
  TokenPair
} from '@audius/common/src/store/ui/buy-sell/types'
import {
  IconLogoCircleUSDC,
  IconTokenAUDIO,
  IconTokenBonk
} from '@audius/harmony'

import { env } from 'services/env'

// Create tokens from centralized configuration with icons for web
const createTokensWithIcons = (): Record<string, TokenInfo> => {
  const baseTokens = createTokens(env)
  const iconMap = {
    AUDIO: IconTokenAUDIO,
    USDC: IconLogoCircleUSDC,
    BONK: IconTokenBonk
  }

  const tokensWithIcons: Record<string, TokenInfo> = {}
  Object.entries(baseTokens).forEach(([symbol, token]) => {
    tokensWithIcons[symbol] = {
      ...token,
      icon: iconMap[symbol as keyof typeof iconMap]
    }
  })

  return tokensWithIcons
}

export const TOKENS: Record<string, TokenInfo> = createTokensWithIcons()

// Create supported token pairs dynamically with icons for web
const createSupportedTokenPairsWithIcons = (): TokenPair[] => {
  const basePairs = createSupportedTokenPairs(env)
  const tokensWithIcons = TOKENS

  return basePairs.map((pair) => ({
    ...pair,
    baseToken: tokensWithIcons[pair.baseToken.symbol] || pair.baseToken,
    quoteToken: tokensWithIcons[pair.quoteToken.symbol] || pair.quoteToken
  }))
}

export const SUPPORTED_TOKEN_PAIRS: TokenPair[] =
  createSupportedTokenPairsWithIcons()
