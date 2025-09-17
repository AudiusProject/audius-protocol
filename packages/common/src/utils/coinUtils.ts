import { UserCoin } from '~/api'

/**
 * Filters user coins based on the ARTIST_COINS feature flag and balance requirements
 *
 * @param userCoins - Array of user coins to filter
 * @param isArtistCoinsEnabled - Whether the ARTIST_COINS feature flag is enabled
 * @param wAudioMintAddress - The WAUDIO mint address from environment
 * @returns Filtered array of user coins
 */
export const filterUserCoins = (
  userCoins: UserCoin[] | undefined,
  isArtistCoinsEnabled: boolean,
  wAudioMintAddress: string
): UserCoin[] => {
  if (!userCoins) {
    return []
  }

  return userCoins.filter((coin) => {
    if (!isArtistCoinsEnabled) {
      // When artist coins disabled, only show AUDIO
      return coin.mint === wAudioMintAddress
    }

    // When artist coins enabled, show all non-USDC tokens with balance > 0
    // OR AUDIO regardless of balance
    return (
      coin.ticker !== 'USDC' &&
      (coin.balance > 0 || coin.mint === wAudioMintAddress)
    )
  })
}
