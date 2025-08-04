import { UserCoin } from '../../../api'

export type CoinPairItem = UserCoin | 'find-more'

/**
 * Groups coins into pairs for 2-column layout rendering.
 * Filters out USDC coins and pairs remaining coins with FindMoreCoins component.
 *
 * @param coins Array of user coins
 * @returns Array of coin pairs, where each pair contains 1-2 items
 */
export const groupCoinsIntoPairs = (coins: UserCoin[] | undefined) => {
  if (!coins) return []

  // Filter out USDC coins
  const filteredCoins = coins.filter((coin) => coin.ticker !== 'USDC')

  // Group coins into pairs for row rendering
  const coinPairs: CoinPairItem[][] = []

  for (let i = 0; i < filteredCoins.length; i += 2) {
    const pair: CoinPairItem[] = [filteredCoins[i]]
    if (i + 1 < filteredCoins.length) {
      pair.push(filteredCoins[i + 1])
    } else {
      // If odd number of coins, pair the last one with FindMoreCoins
      pair.push('find-more')
    }
    coinPairs.push(pair)
  }

  // If even number of coins, FindMoreCoins gets its own row
  if (filteredCoins.length % 2 === 0) {
    coinPairs.push(['find-more'])
  }

  return coinPairs
}
