import React from 'react'

import { route } from '@audius/common/utils'
import { IconSearch } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'
import { NavSpeakerIcon } from '../NavSpeakerIcon'
import { useNavSourcePlayingStatus } from '../useNavSourcePlayingStatus'

const { EXPLORE_PAGE, SEARCH_BASE_ROUTE } = route

export const ExploreNavItem = () => {
  const playingFromRoute = useNavSourcePlayingStatus()

  return (
    <LeftNavLink
      leftIcon={IconSearch}
      to={EXPLORE_PAGE}
      additionalPathMatches={[SEARCH_BASE_ROUTE]}
      restriction='none'
      rightIcon={
        <NavSpeakerIcon
          playingFromRoute={playingFromRoute}
          targetRoute={EXPLORE_PAGE}
        />
      }
    >
      Explore
    </LeftNavLink>
  )
}
