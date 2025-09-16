import { useMemo } from 'react'

import { useQueryContext, UserCoin } from '~/api'

export type CoinPairItem = UserCoin | 'audio-coin'

/**
 * Groups coins into pairs for responsive layout rendering.
 * Filters out USDC coins for responsive layout.
 *
 * @param coins Array of user coins
 * @param singleColumn Whether to force single column layout (1 item per row)
 * @returns Array of coin pairs, where each pair contains 1-2 items
 */
export const useGroupCoinPairs = (coins?: UserCoin[], singleColumn = false) => {
  const { env } = useQueryContext()

  return useMemo(() => {
    if (!coins) {
      return []
    }

    // Filter out USDC coins
    const filteredCoins = coins.filter((coin) => {
      return (
        coin.ticker !== 'USDC' &&
        (coin.balance > 0 || coin.mint === env.WAUDIO_MINT_ADDRESS)
      )
    })

    // Group coins for responsive layout
    const coinPairs: CoinPairItem[][] = []

    // If no coins after filtering, show audio coin card
    if (filteredCoins.length === 0) {
      return [['audio-coin']]
    }

    if (singleColumn) {
      // Single column layout - each coin gets its own row
      filteredCoins.forEach((coin) => {
        coinPairs.push([coin])
      })
    } else {
      // Two column layout - group coins into pairs
      for (let i = 0; i < filteredCoins.length; i += 2) {
        const pair: CoinPairItem[] = [filteredCoins[i]]
        if (i + 1 < filteredCoins.length) {
          pair.push(filteredCoins[i + 1])
        }
        coinPairs.push(pair)
      }
    }

    return coinPairs
  }, [coins, env.WAUDIO_MINT_ADDRESS, singleColumn])
}
