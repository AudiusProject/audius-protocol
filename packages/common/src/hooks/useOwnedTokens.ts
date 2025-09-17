import { useMemo } from 'react'

import { useCurrentUserId, useUserCoins, UserCoin } from '~/api'
import type { TokenInfo } from '~/store'

/**
 * Hook to filter tokens based on user ownership and positive balance
 * Returns both owned tokens and all available tokens for different use cases
 */
export const useOwnedTokens = (allTokens: TokenInfo[]) => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: userCoins } = useUserCoins({ userId: currentUserId })

  const { ownedTokens, allAvailableTokens } = useMemo(() => {
    if (!userCoins || !allTokens.length) {
      return { ownedTokens: [], allAvailableTokens: allTokens }
    }

    // Create a map of user's owned tokens by mint address
    const userOwnedMints = new Set(
      userCoins
        .filter((coin: UserCoin) => coin.balance > 0)
        .map((coin: UserCoin) => coin.mint)
    )

    // Filter available tokens to only include ones the user owns
    const ownedTokensList = allTokens.filter((token) =>
      userOwnedMints.has(token.address)
    )

    return {
      ownedTokens: ownedTokensList,
      allAvailableTokens: allTokens
    }
  }, [userCoins, allTokens])

  return {
    ownedTokens,
    allAvailableTokens,
    isLoading: !userCoins
  }
}
