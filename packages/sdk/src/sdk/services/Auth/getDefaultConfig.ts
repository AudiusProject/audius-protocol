import { SdkServicesConfig } from '../../config/types'
import { getPlatformLocalStorage } from '../../utils/localStorage'

import { UserAuthConfigInternal } from './types'

export const getDefaultUserAuthConfig = (
  config: SdkServicesConfig
): UserAuthConfigInternal => ({
  identityService: config.network.identityService,
  useLocalStorage: true,
  localStorage: getPlatformLocalStorage()
})
