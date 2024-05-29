import { FeatureFlags } from '@audius/common/services'

import { useFlag } from 'hooks/useRemoteConfig'

import EditTrackModalLegacy from './EditTrackModalLegacy'
import { EditTrackModalNew } from './EditTrackModalNew'

export const EditTrackModal = () => {
  const { isEnabled: isEditTrackRedesignEnabled } = useFlag(
    FeatureFlags.EDIT_TRACK_REDESIGN
  )

  return isEditTrackRedesignEnabled ? (
    <EditTrackModalNew />
  ) : (
    <EditTrackModalLegacy />
  )
}

// Support lazy import
export default EditTrackModal
