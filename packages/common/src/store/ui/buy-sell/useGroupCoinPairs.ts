import { useMemo } from 'react'

import { useQueryContext, UserCoin } from '~/api'
import { useFeatureFlag } from '~/hooks'
import { FeatureFlags } from '~/services'

export type CoinPairItem = UserCoin | 'find-more' | 'audio-coin'

/**
 * Groups coins into pairs for responsive layout rendering.
 * Filters out USDC coins and optionally pairs remaining coins with FindMoreCoins component
 * based on the ARTIST_COINS feature flag.
 *
 * @param coins Array of user coins
 * @param singleColumn Whether to force single column layout (1 item per row)
 * @returns Array of coin pairs, where each pair contains 1-2 items
 */
export const useGroupCoinPairs = (coins?: UserCoin[], singleColumn = false) => {
  const { env } = useQueryContext()
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  return useMemo(() => {
    if (!coins) {
      return isArtistCoinsEnabled ? [['find-more']] : []
    }

    // Filter out USDC coins
    const filteredCoins = coins.filter((coin) => {
      if (!isArtistCoinsEnabled) return coin.mint === env.WAUDIO_MINT_ADDRESS
      return (
        coin.ticker !== 'USDC' &&
        (coin.balance > 0 || coin.mint === env.WAUDIO_MINT_ADDRESS)
      )
    })

    // Group coins for responsive layout
    const coinPairs: CoinPairItem[][] = []

    // If no coins after filtering, show audio coin card
    if (filteredCoins.length === 0) {
      const basePairs: CoinPairItem[][] = [['audio-coin']]

      if (singleColumn && isArtistCoinsEnabled) {
        basePairs.push(['find-more'])
      } else if (!singleColumn && isArtistCoinsEnabled) {
        basePairs[0].push('find-more')
      }

      return basePairs
    }

    if (singleColumn) {
      // Single column layout - each coin gets its own row
      filteredCoins.forEach((coin) => {
        coinPairs.push([coin])
      })

      // Add FindMoreCoins in its own row if artist coins enabled
      if (isArtistCoinsEnabled) {
        coinPairs.push(['find-more'])
      }
    } else {
      // Two column layout - group coins into pairs
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
    }

    return coinPairs
  }, [coins, env.WAUDIO_MINT_ADDRESS, isArtistCoinsEnabled, singleColumn])
}
