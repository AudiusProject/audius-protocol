import React from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

import { IconArtistCoin } from '@audius/harmony-native'

import { LeftNavLink } from './LeftNavLink'

const messages = {
  artistCoins: 'Artist Coins'
}

export const ArtistCoinsNavItem = () => {
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  if (!isArtistCoinsEnabled) {
    return null
  }

  return (
    <LeftNavLink
      icon={IconArtistCoin}
      label={messages.artistCoins}
      to='ArtistCoinsExplore'
    />
  )
}
