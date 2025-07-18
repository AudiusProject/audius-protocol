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

  let artistCoinTicker
  if (coins && coins.length > 0) {
    const firstCoin = coins[0]
    if (firstCoin.mint) {
      const tokenRegistry = getTokenRegistry()
      const token = tokenRegistry.getTokenByAddress(firstCoin.mint)
      artistCoinTicker = token?.symbol
    }
  }

  const shouldShowArtistCoinHeader =
    isArtistCoinEnabled &&
    audience === ChatBlastAudience.COIN_HOLDERS &&
    artistCoinTicker

  return {
    shouldShowArtistCoinHeader,
    artistCoinTicker
  }
}
