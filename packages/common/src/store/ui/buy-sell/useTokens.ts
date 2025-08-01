import { useMemo } from 'react'

import {
  transformArtistCoinsToTokenInfoMap,
  useArtistCoins,
  useQueryContext
} from '~/api'

import { TokenPair } from './types'

// Hook to get tokens from API
export const useTokens = () => {
  const { data: artistCoins = [], isLoading, error } = useArtistCoins()
  const { env } = useQueryContext()

  return useMemo(() => {
    const tokensMap = transformArtistCoinsToTokenInfoMap(artistCoins)

    // Add USDC manually since it's frontend-only and not from API
    tokensMap.USDC = {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      balance: null,
      address: env.USDC_MINT_ADDRESS,
      logoURI:
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
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
