import { StringKeys } from '@audius/common'
import VersionNumber from 'react-native-version-number'
import semver from 'semver'

import { useRemoteVar } from 'app/hooks/useRemoteConfig'

export const useUpdateRequired = () => {
  const { appVersion } = VersionNumber
  const minAppVersion = useRemoteVar(StringKeys.MIN_APP_VERSION)

  return { updateRequired: semver.lt(appVersion, minAppVersion) }
}
