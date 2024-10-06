import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

import { InboxSettingsScreenLegacy } from './InboxSettingsScreenLegacy'
import { InboxSettingsScreenNew } from './InboxSettingsScreenNew'

export const InboxSettingsScreen = () => {
  const { isEnabled: isOneToManyDmsEnabled } = useFeatureFlag(
    FeatureFlags.ONE_TO_MANY_DMS
  )

  return isOneToManyDmsEnabled ? (
    <InboxSettingsScreenNew />
  ) : (
    <InboxSettingsScreenLegacy />
  )
}
