import { FeatureFlags } from '@audius/common/services'

import { useFlag } from 'hooks/useRemoteConfig'

import { InboxSettingsModalLegacy } from './InboxSettingsModalLegacy'
import { InboxSettingsModalNew } from './InboxSettingsModalNew'

const InboxSettingsModal = () => {
  const { isEnabled: isOneToManyDmsEnabled } = useFlag(
    FeatureFlags.ONE_TO_MANY_DMS
  )

  return isOneToManyDmsEnabled ? (
    <InboxSettingsModalNew />
  ) : (
    <InboxSettingsModalLegacy />
  )
}

export default InboxSettingsModal
