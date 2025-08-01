import { ChatBlastAudience } from '@audius/sdk'

import { useArtistCoins } from '~/api/tan-query/coins/useArtistCoins'
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

  const { data: coins } = useArtistCoins({ owner_id: [userId] })

  if (
    !isArtistCoinEnabled ||
    !audience ||
    audience !== ChatBlastAudience.COIN_HOLDERS
  ) {
    return null
  }

  let artistCoinSymbol
  let artistCoin
  if (!!coins && coins.length > 0) {
    artistCoin = coins[0]
    // Get symbol directly from the coin data
    artistCoinSymbol = artistCoin.ticker
  }

  return artistCoinSymbol
}
