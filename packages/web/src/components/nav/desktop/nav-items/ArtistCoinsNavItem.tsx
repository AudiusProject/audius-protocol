import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { route } from '@audius/common/utils'
import { IconArtistCoin } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'

const { COINS_CREATE_PAGE } = route

const messages = {
  title: 'Artist Coins'
}

export const ArtistCoinsNavItem = () => {
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  if (!isArtistCoinsEnabled) {
    return null
  }

  return (
    <LeftNavLink leftIcon={IconArtistCoin} to={COINS_CREATE_PAGE}>
      {messages.title}
    </LeftNavLink>
  )
}
