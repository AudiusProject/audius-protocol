import React from 'react'

import { IconCloudUpload } from '@audius/harmony-native'

import { LeftNavLink } from './LeftNavLink'

export const UploadNavItem = () => {
  return <LeftNavLink icon={IconCloudUpload} label='Upload' to='Upload' />
}
