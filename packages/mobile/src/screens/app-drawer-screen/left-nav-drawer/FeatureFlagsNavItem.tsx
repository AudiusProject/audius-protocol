import React from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

import { IconEmbed } from '@audius/harmony-native'
import { env } from 'app/services/env'

import { LeftNavLink } from './LeftNavLink'

const messages = {
  featureFlags: 'Feature Flags'
}

export const FeatureFlagsNavItem = () => {
  const { isEnabled: isFeatureFlagAccessEnabled } = useFeatureFlag(
    FeatureFlags.FEATURE_FLAG_ACCESS
  )

  // Only show in staging or if feature flag access is enabled
  if (env.ENVIRONMENT !== 'staging' && !isFeatureFlagAccessEnabled) {
    return null
  }

  return (
    <LeftNavLink
      icon={IconEmbed}
      label={messages.featureFlags}
      to='FeatureFlagOverride'
    />
  )
}
