import React from 'react'

import { useHasAccount } from '@audius/common/api'
import { route } from '@audius/common/utils'
import { IconLibrary } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'
import { NavSpeakerIcon } from '../NavSpeakerIcon'
import { useNavSourcePlayingStatus } from '../useNavSourcePlayingStatus'

const { LIBRARY_PAGE } = route

export const LibraryNavItem = () => {
  const hasAccount = useHasAccount()
  const playingFromRoute = useNavSourcePlayingStatus()

  return (
    <LeftNavLink
      leftIcon={IconLibrary}
      to={LIBRARY_PAGE}
      disabled={!hasAccount}
      restriction='guest'
      rightIcon={
        <NavSpeakerIcon
          playingFromRoute={playingFromRoute}
          targetRoute={LIBRARY_PAGE}
        />
      }
    >
      Library
    </LeftNavLink>
  )
}
