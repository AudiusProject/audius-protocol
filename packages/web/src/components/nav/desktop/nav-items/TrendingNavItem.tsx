import React from 'react'

import { route } from '@audius/common/utils'
import { IconTrending } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'
import { NavSpeakerIcon } from '../NavSpeakerIcon'
import { useNavSourcePlayingStatus } from '../useNavSourcePlayingStatus'

const { TRENDING_PAGE } = route

export const TrendingNavItem = () => {
  const playingFromRoute = useNavSourcePlayingStatus()

  return (
    <LeftNavLink
      leftIcon={IconTrending}
      to={TRENDING_PAGE}
      restriction='none'
      rightIcon={
        <NavSpeakerIcon
          playingFromRoute={playingFromRoute}
          targetRoute={TRENDING_PAGE}
        />
      }
    >
      Trending
    </LeftNavLink>
  )
}
