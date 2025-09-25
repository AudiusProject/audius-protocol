import { ChatBlastAudience } from '@audius/sdk'

import { useArtistOwnedCoin } from '~/api/tan-query/coins/useArtistOwnedCoin'
import { ID } from '~/models'

import { FeatureFlags } from '../services'

import { useFeatureFlag } from './useFeatureFlag'

export const useArtistCoinMessageHeader = ({
  userId,
  audience
}: {
  userId: ID
  audience?: ChatBlastAudience
}) => {
  const { isEnabled: isArtistCoinEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: coin } = useArtistOwnedCoin(userId)

  if (
    !isArtistCoinEnabled ||
    !audience ||
    audience !== ChatBlastAudience.COIN_HOLDERS
  ) {
    return null
  }

  let artistCoinSymbol
  let artistCoin
  if (coin) {
    artistCoin = coin
    // Get symbol directly from the coin data
    artistCoinSymbol = artistCoin.ticker
  }

  return artistCoinSymbol
}
