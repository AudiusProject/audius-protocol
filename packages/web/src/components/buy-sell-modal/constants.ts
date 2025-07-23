import { useMemo } from 'react'

import { transformArtistCoinsToTokenInfoMap } from '@audius/common/src/api/tan-query/coins/tokenUtils'
import { useArtistCoins } from '@audius/common/src/api/tan-query/coins/useArtistCoins'
import {
  TokenInfo,
  TokenPair
} from '@audius/common/src/store/ui/buy-sell/types'
import {
  IconLogoCircleUSDC,
  IconTokenAUDIO,
  IconTokenBonk
} from '@audius/harmony'

// Icon mapping for web components
export const TOKEN_ICON_MAP = {
  AUDIO: IconTokenAUDIO,
  USDC: IconLogoCircleUSDC,
  BONK: IconTokenBonk
}

// Hook to get tokens from API
export const useTokens = () => {
  const { data: artistCoins = [], isLoading, error } = useArtistCoins()

  return useMemo(() => {
    const tokensMap = transformArtistCoinsToTokenInfoMap(
      artistCoins,
      TOKEN_ICON_MAP
    )
    return {
      tokens: tokensMap,
      isLoading,
      error
    }
  }, [artistCoins, isLoading, error])
}

// Hook to get supported token pairs
export const useSupportedTokenPairs = () => {
  const { tokens, isLoading, error } = useTokens()

  return useMemo(() => {
    if (isLoading || error || Object.keys(tokens).length === 0) {
      return {
        pairs: [] as TokenPair[],
        isLoading,
        error
      }
    }

    const pairs: TokenPair[] = []
    const tokenList = Object.values(tokens)

    // Find specific tokens for explicit ordering
    const audioToken = tokenList.find((token) => token.symbol === 'AUDIO')
    const usdcToken = tokenList.find((token) => token.symbol === 'USDC')

    // First pair: AUDIO/USDC (for Buy: USDC -> AUDIO, Sell: AUDIO -> USDC)
    if (audioToken && usdcToken) {
      pairs.push({
        baseToken: audioToken,
        quoteToken: usdcToken,
        exchangeRate: null
      })
    }

    // Generate remaining pairs, excluding the AUDIO/USDC pair we already added
    tokenList.forEach((baseToken) => {
      tokenList.forEach((quoteToken) => {
        if (baseToken.symbol !== quoteToken.symbol) {
          // Skip AUDIO/USDC pair as we already added it
          if (baseToken.symbol === 'AUDIO' && quoteToken.symbol === 'USDC') {
            return
          }
          pairs.push({
            baseToken,
            quoteToken,
            exchangeRate: null
          })
        }
      })
    })

    return {
      pairs,
      isLoading,
      error
    }
  }, [tokens, isLoading, error])
}

// Backward compatibility - static exports (deprecated)
// These will be empty until the hooks are used
export const TOKENS: Record<string, TokenInfo> = {}
export const SUPPORTED_TOKEN_PAIRS: TokenPair[] = []
