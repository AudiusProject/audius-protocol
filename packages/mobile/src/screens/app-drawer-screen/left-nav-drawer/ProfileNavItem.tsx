import React from 'react'

import { IconUser } from '@audius/harmony-native'

import { LeftNavLink } from './LeftNavLink'

const messages = {
  profile: 'My Profile'
}

export const ProfileNavItem = () => {
  return (
    <LeftNavLink
      icon={IconUser}
      label={messages.profile}
      to='Profile'
      params={{ handle: 'accountUser' }}
    />
  )
}
