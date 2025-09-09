import { useMemo } from 'react'

import {
  transformArtistCoinsToTokenInfoMap,
  useArtistCoins,
  useQueryContext
} from '~/api'
import { TokenInfo, TokenPair } from '~/store'

import {
  createFallbackPair,
  createPairFromSymbols,
  findTokenByAddress,
  findTokenBySymbol
} from './utils'

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

// Hook to get supported token pairs with on-demand generation for memory efficiency
export const useSupportedTokenPairs = () => {
  const { tokens, isLoading, error } = useTokens()

  // Memoize token data and create cached pair objects
  const { defaultPair, getPair, findPairByAddress, getPairsForToken, hasPair } =
    useMemo(() => {
      if (isLoading || error || Object.keys(tokens).length === 0) {
        return {
          defaultPair: null,
          getPair: () => null,
          findPairByAddress: () => null,
          getPairsForToken: () => [],
          hasPair: () => false
        }
      }

      // Create pair cache to avoid recreating pair objects
      const pairCache = new Map<string, TokenPair>()

      const createCachedPair = (
        baseToken: TokenInfo,
        quoteToken: TokenInfo
      ): TokenPair => {
        const cacheKey = `${baseToken.symbol}/${quoteToken.symbol}`

        if (!pairCache.has(cacheKey)) {
          pairCache.set(cacheKey, {
            baseToken,
            quoteToken,
            exchangeRate: null
          })
        }

        return pairCache.get(cacheKey)!
      }

      // Create stable default pair object - only recreated when tokens change
      const defaultPair =
        createPairFromSymbols('AUDIO', 'USDC', tokens) || createFallbackPair()

      const getPair = (
        baseSymbol: string,
        quoteSymbol: string
      ): TokenPair | null => {
        const baseToken = findTokenBySymbol(baseSymbol, tokens)
        const quoteToken = findTokenBySymbol(quoteSymbol, tokens)

        if (
          !baseToken ||
          !quoteToken ||
          baseToken.symbol === quoteToken.symbol
        ) {
          return null
        }

        return createCachedPair(baseToken, quoteToken)
      }

      const findPairByAddress = (
        baseAddress: string,
        quoteSymbol: string
      ): TokenPair | null => {
        const baseToken = findTokenByAddress(baseAddress, tokens)
        const quoteToken = findTokenBySymbol(quoteSymbol, tokens)

        if (!baseToken || !quoteToken) return null

        return createCachedPair(baseToken, quoteToken)
      }

      const getPairsForToken = (tokenSymbol: string): TokenPair[] => {
        const targetToken = findTokenBySymbol(tokenSymbol, tokens)
        if (!targetToken) return []

        return Object.values(tokens)
          .filter((otherToken) => otherToken.symbol !== targetToken.symbol)
          .map((otherToken) => createCachedPair(targetToken, otherToken))
      }

      // Additional utility methods

      const hasPair = (baseSymbol: string, quoteSymbol: string): boolean => {
        const baseToken = findTokenBySymbol(baseSymbol, tokens)
        const quoteToken = findTokenBySymbol(quoteSymbol, tokens)
        return !!(
          baseToken &&
          quoteToken &&
          baseToken.symbol !== quoteToken.symbol
        )
      }

      return {
        defaultPair,
        getPair,
        findPairByAddress,
        getPairsForToken,
        hasPair
      }
    }, [tokens, isLoading, error])

  // Return stable API object
  return useMemo(
    () => ({
      // Core API methods
      getPair,
      getDefaultPair: () => defaultPair,
      findPairByAddress,
      getPairsForToken,

      // Additional utility methods
      hasPair,

      // Status
      isLoading,
      error
    }),
    [
      defaultPair,
      getPair,
      findPairByAddress,
      getPairsForToken,
      hasPair,
      isLoading,
      error
    ]
  )
}
