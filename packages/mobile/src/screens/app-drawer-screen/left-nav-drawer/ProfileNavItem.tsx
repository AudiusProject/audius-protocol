import React from 'react'

import { useCurrentUserId } from '@audius/common/api'

import { IconUser } from '@audius/harmony-native'

import { LeftNavLink } from './LeftNavLink'

const messages = {
  profile: 'My Profile'
}

export const ProfileNavItem = () => {
  const { data: id } = useCurrentUserId()
  if (!id) return null

  return (
    <LeftNavLink
      icon={IconUser}
      label={messages.profile}
      to='Profile'
      params={{ id }}
    />
  )
}
