import { ChatBlastAudience } from '@audius/sdk'

import { useArtistCoin } from '~/api/tan-query/coins/useArtistCoin'
import { ID } from '~/models'
import { getTokenRegistry } from '~/services/tokens/TokenRegistry'

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

  const { data: coins } = useArtistCoin({ owner_id: [userId] })

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
    if (artistCoin.mint) {
      const tokenRegistry = getTokenRegistry()
      const token = tokenRegistry.getTokenByAddress(artistCoin.mint)
      artistCoinSymbol = token?.symbol
    }
  }

  return artistCoinSymbol
}
