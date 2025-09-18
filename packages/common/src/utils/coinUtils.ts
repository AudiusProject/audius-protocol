import { UserCoin } from '~/api'

/**
 * Creates a predicate function for filtering user coins based on the ARTIST_COINS feature flag and balance requirements
 *
 * @param isArtistCoinsEnabled - Whether the ARTIST_COINS feature flag is enabled
 * @param wAudioMintAddress - The WAUDIO mint address from environment
 * @returns Predicate function that can be used with Array.filter()
 */
export const ownedCoinsFilter =
  (isArtistCoinsEnabled: boolean, wAudioMintAddress: string) =>
  (coin: UserCoin): boolean => {
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
  }
