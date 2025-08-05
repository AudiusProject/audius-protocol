import { useMemo } from 'react'

import { TokenInfo, TokenPair } from '~/store'

export const useAvailableTokens = ({
  tokens,
  supportedTokenPairs,
  isTokenDataLoading
}: {
  tokens: Record<string, TokenInfo>
  supportedTokenPairs: TokenPair[]
  isTokenDataLoading: boolean
}) => {
  return useMemo(() => {
    if (isTokenDataLoading || Object.keys(tokens).length === 0) {
      return []
    }

    const tokensSet = new Set<string>()
    supportedTokenPairs.forEach((pair) => {
      tokensSet.add(pair.baseToken.symbol)
      tokensSet.add(pair.quoteToken.symbol)
    })
    return Array.from(tokensSet)
      .map((symbol) => Object.values(tokens).find((t) => t.symbol === symbol))
      .filter(Boolean) as TokenInfo[]
  }, [tokens, supportedTokenPairs, isTokenDataLoading])
}
