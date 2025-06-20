import React from 'react'

import { useHasAccount } from '@audius/common/api'
import { route } from '@audius/common/utils'
import { IconFeed } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'
import { NavSpeakerIcon } from '../NavSpeakerIcon'
import { useNavSourcePlayingStatus } from '../useNavSourcePlayingStatus'

const { FEED_PAGE } = route

export const FeedNavItem = () => {
  const hasAccount = useHasAccount()
  const playingFromRoute = useNavSourcePlayingStatus()

  return (
    <LeftNavLink
      leftIcon={IconFeed}
      to={FEED_PAGE}
      disabled={!hasAccount}
      restriction='account'
      rightIcon={
        <NavSpeakerIcon
          playingFromRoute={playingFromRoute}
          targetRoute={FEED_PAGE}
        />
      }
    >
      Feed
    </LeftNavLink>
  )
}
