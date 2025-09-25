import { useMemo } from 'react'

import { useUserCoins, useArtistCoins } from '~/api'
import { ID } from '~/models'

/**
 * Hook to check if a user owns a specific artist's coin
 * @param userId - The user ID to check coin ownership for
 * @param artistId - The artist ID whose coin to check for ownership
 * @returns Object with isCoinHolder boolean and loading state
 */
export const useIsCoinHolder = (
  userId: ID | null | undefined,
  artistId: ID | null | undefined
) => {
  const { data: userCoins } = useUserCoins({ userId })
  const { data: artistCoins } = useArtistCoins({
    owner_id: artistId ? [artistId] : undefined
  })

  const isCoinHolder = useMemo(() => {
    if (!userCoins || !artistCoins || !artistId || !userId) {
      return false
    }

    // Get the artist's coin mint address
    const artistCoin = artistCoins.find((coin) => coin.ownerId === artistId)
    if (!artistCoin?.mint) {
      return false
    }

    // Check if the user owns this specific artist's coin with positive balance
    return userCoins.some(
      (userCoin) => userCoin.mint === artistCoin.mint && userCoin.balance > 0
    )
  }, [userCoins, artistCoins, artistId, userId])

  const isLoading = !userCoins || !artistCoins

  return {
    isCoinHolder,
    isLoading
  }
}
