import React from 'react'

import { IconSettings } from '@audius/harmony-native'

import { LeftNavLink } from './LeftNavLink'

export const SettingsNavItem = () => {
  return (
    <LeftNavLink icon={IconSettings} label='Settings' to='SettingsScreen' />
  )
}
