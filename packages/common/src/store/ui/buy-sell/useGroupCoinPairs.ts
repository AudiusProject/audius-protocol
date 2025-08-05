import { useMemo } from 'react'

import { UserCoin } from '~/api'
import { useFeatureFlag } from '~/hooks'
import { FeatureFlags } from '~/services'

export type CoinPairItem = UserCoin | 'find-more'

/**
 * Groups coins into pairs for 2-column layout rendering.
 * Filters out USDC coins and optionally pairs remaining coins with FindMoreCoins component
 * based on the ARTIST_COINS feature flag.
 *
 * @param coins Array of user coins
 * @returns Array of coin pairs, where each pair contains 1-2 items
 */
export const useGroupCoinPairs = (coins?: UserCoin[]) => {
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  return useMemo(() => {
    if (!coins) return []

    // Filter out USDC coins
    const filteredCoins = coins.filter((coin) => coin.ticker !== 'USDC')

    // Group coins into pairs for row rendering
    const coinPairs: CoinPairItem[][] = []

    for (let i = 0; i < filteredCoins.length; i += 2) {
      const pair: CoinPairItem[] = [filteredCoins[i]]
      if (i + 1 < filteredCoins.length) {
        pair.push(filteredCoins[i + 1])
      } else if (isArtistCoinsEnabled) {
        // If odd number of coins and artist coins enabled, pair the last one with FindMoreCoins
        pair.push('find-more')
      }
      coinPairs.push(pair)
    }

    // If even number of coins and artist coins enabled, FindMoreCoins gets its own row
    if (filteredCoins.length % 2 === 0 && isArtistCoinsEnabled) {
      coinPairs.push(['find-more'])
    }

    return coinPairs
  }, [coins, isArtistCoinsEnabled])
}
