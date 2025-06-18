import { useRemoteVar } from '@audius/common/hooks'
import { StringKeys } from '@audius/common/services'
import semver from 'semver'

import packageInfo from '../../package.json'

const { version } = packageInfo

export const useUpdateRequired = () => {
  const minAppVersion = useRemoteVar(StringKeys.MIN_APP_VERSION)

  return {
    updateRequired: minAppVersion ? semver.lt(version, minAppVersion) : false
  }
}
