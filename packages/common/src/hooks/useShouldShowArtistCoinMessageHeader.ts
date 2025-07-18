import { ChatBlastAudience } from '@audius/sdk'

import { useArtistCoin } from '~/api/tan-query/coins/useArtistCoin'
import { ID } from '~/models'

import { FeatureFlags } from '../services'

import { useFeatureFlag } from './useFeatureFlag'

export const useShouldShowArtistCoinMessageHeader = ({
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
  console.log('REED', { coins })

  return (
    isArtistCoinEnabled &&
    coins?.length &&
    coins.length > 0 &&
    audience === ChatBlastAudience.COIN_HOLDERS
  )
}
