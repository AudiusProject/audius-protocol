import { useMemo } from 'react'

import { TokenInfo, TokenPair } from '~/store'

import { createPairFromSymbols } from './utils'

export const useCurrentTokenPair = ({
  baseTokenSymbol,
  quoteTokenSymbol,
  availableTokens,
  selectedPair,
  getPair
}: {
  baseTokenSymbol: string
  quoteTokenSymbol: string
  availableTokens: TokenInfo[]
  selectedPair: TokenPair | null
  getPair?: (baseSymbol: string, quoteSymbol: string) => TokenPair | null
}) => {
  return useMemo(() => {
    // Convert availableTokens array to map for efficient lookup
    const tokenMap = availableTokens.reduce((map, token) => {
      map[token.symbol] = token
      return map
    }, {} as Record<string, TokenInfo>)

    // Try to get pair using the efficient API first
    if (getPair) {
      const pair = getPair(baseTokenSymbol, quoteTokenSymbol)
      if (pair) {
        return pair
      }
    }

    // Fallback to creating pair from available tokens
    const pair = createPairFromSymbols(baseTokenSymbol, quoteTokenSymbol, tokenMap)
    if (pair) {
      return pair
    }

    // Final fallback to selected pair or null
    return selectedPair || null
  }, [
    baseTokenSymbol,
    quoteTokenSymbol,
    availableTokens,
    selectedPair,
    getPair
  ])
}
