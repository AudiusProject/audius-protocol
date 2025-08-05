import { useMemo } from 'react'

import { TokenInfo, TokenPair } from '~/store'

export const useCurrentTokenPair = ({
  baseTokenSymbol,
  quoteTokenSymbol,
  availableTokens,
  selectedPair,
  supportedTokenPairs
}: {
  baseTokenSymbol: string
  quoteTokenSymbol: string
  availableTokens: TokenInfo[]
  selectedPair: TokenPair | null
  supportedTokenPairs: TokenPair[]
}) => {
  return useMemo(() => {
    // Handle both regular and $ prefixed symbols from API
    const baseTokenInfo = availableTokens.find(
      (t) =>
        t.symbol === baseTokenSymbol ||
        t.symbol === `$${baseTokenSymbol}` ||
        t.symbol === baseTokenSymbol.replace('$', '')
    )
    const quoteTokenInfo = availableTokens.find(
      (t) =>
        t.symbol === quoteTokenSymbol ||
        t.symbol === `$${quoteTokenSymbol}` ||
        t.symbol === quoteTokenSymbol.replace('$', '')
    )

    if (!baseTokenInfo || !quoteTokenInfo) {
      return selectedPair || null
    }

    // Find existing pair that matches our tokens
    // Handle symbol variations for pair matching
    const pair = supportedTokenPairs.find((p) => {
      const baseMatch =
        p.baseToken.symbol === baseTokenSymbol ||
        p.baseToken.symbol === `$${baseTokenSymbol}` ||
        p.baseToken.symbol === baseTokenSymbol.replace('$', '')
      const quoteMatch =
        p.quoteToken.symbol === quoteTokenSymbol ||
        p.quoteToken.symbol === `$${quoteTokenSymbol}` ||
        p.quoteToken.symbol === quoteTokenSymbol.replace('$', '')
      return baseMatch && quoteMatch
    })

    if (pair) {
      return pair
    }

    // Create a dynamic pair if no exact match found
    return {
      baseToken: baseTokenInfo,
      quoteToken: quoteTokenInfo,
      exchangeRate: null
    }
  }, [
    baseTokenSymbol,
    quoteTokenSymbol,
    availableTokens,
    selectedPair,
    supportedTokenPairs
  ])
}
