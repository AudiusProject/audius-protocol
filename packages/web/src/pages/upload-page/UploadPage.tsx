import { FeatureFlags } from '@audius/common'

import { useFlag } from 'hooks/useRemoteConfig'

import UploadPageLegacy from './UploadPageLegacy'
import { UploadPageNew } from './UploadPageNew'

export const UploadPage = (props: any) => {
  const { isEnabled: isRedesignEnabled } = useFlag(
    FeatureFlags.UPLOAD_REDESIGN_ENABLED
  )

  return isRedesignEnabled ? (
    <UploadPageNew {...props} />
  ) : (
    <UploadPageLegacy {...props} />
  )
}

export default UploadPage
