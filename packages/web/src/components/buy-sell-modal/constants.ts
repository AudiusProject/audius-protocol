import { useMemo } from 'react'

import {
  transformArtistCoinsToTokenInfoMap,
  useArtistCoins,
  useQueryContext
} from '@audius/common/api'
import { TokenInfo, TokenPair } from '@audius/common/store'
import {
  IconLogoCircleUSDC,
  IconTokenAUDIO,
  IconTokenBonk
} from '@audius/harmony'

// Icon mapping for web components - handles symbols with $ prefix
const createTokenIconMap = () => {
  const baseMap = {
    AUDIO: IconTokenAUDIO,
    USDC: IconLogoCircleUSDC,
    BONK: IconTokenBonk
  }

  const iconMap: Record<string, any> = { ...baseMap }

  // Add $ prefixed versions
  Object.entries(baseMap).forEach(([key, value]) => {
    iconMap[`$${key}`] = value
  })

  return iconMap
}

export const TOKEN_ICON_MAP = createTokenIconMap()

// Hook to get tokens from API
export const useTokens = () => {
  const { data: artistCoins = [], isLoading, error } = useArtistCoins()
  const { env } = useQueryContext()

  return useMemo(() => {
    const tokensMap = transformArtistCoinsToTokenInfoMap(
      artistCoins,
      TOKEN_ICON_MAP
    )

    // Add USDC manually since it's frontend-only and not from API
    tokensMap.USDC = {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      balance: null,
      address: env.USDC_MINT_ADDRESS,
      icon: IconLogoCircleUSDC,
      logoURI: undefined, // Use icon instead of logoURI for USDC
      isStablecoin: true
    }

    return {
      tokens: tokensMap,
      isLoading,
      error
    }
  }, [artistCoins, isLoading, error, env.USDC_MINT_ADDRESS])
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
    // Handle both regular and $ prefixed symbols from API
    const audioToken = tokenList.find(
      (token) => token.symbol === 'AUDIO' || token.symbol === '$AUDIO'
    )
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
          // Skip AUDIO/USDC pair as we already added it (handle symbol variations)
          const isAudioToken =
            baseToken.symbol === 'AUDIO' || baseToken.symbol === '$AUDIO'
          const isUsdcToken = quoteToken.symbol === 'USDC'
          if (isAudioToken && isUsdcToken) {
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
