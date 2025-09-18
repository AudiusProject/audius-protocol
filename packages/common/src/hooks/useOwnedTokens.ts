import { useMemo } from 'react'

import {
  useCurrentUserId,
  useUserCoins,
  useQueryContext,
  UserCoin
} from '~/api'
import { useFeatureFlag } from '~/hooks'
import { FeatureFlags } from '~/services'
import type { TokenInfo } from '~/store'
import { ownedCoinsFilter } from '~/utils'

/**
 * Hook to filter tokens based on user ownership and positive balance
 * Respects the ARTIST_COINS feature flag - when disabled, only shows AUDIO tokens
 */
export const useOwnedTokens = (allTokens: TokenInfo[]) => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: userCoins } = useUserCoins({ userId: currentUserId })
  const { env } = useQueryContext()
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const ownedTokens = useMemo(() => {
    if (!userCoins || !allTokens.length) {
      return []
    }

    const filteredUserCoins = userCoins.filter(
      ownedCoinsFilter(!!isArtistCoinsEnabled, env.WAUDIO_MINT_ADDRESS)
    )

    // Create a map of user's owned tokens by mint address
    const userOwnedMints = new Set(
      filteredUserCoins.map((coin: UserCoin) => coin.mint)
    )

    // Filter available tokens to only include ones the user owns
    const ownedTokensList = allTokens.filter((token) =>
      userOwnedMints.has(token.address)
    )

    return ownedTokensList
  }, [userCoins, allTokens, isArtistCoinsEnabled, env.WAUDIO_MINT_ADDRESS])

  return {
    ownedTokens,
    isLoading: !userCoins
  }
}
