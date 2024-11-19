import { SdkServicesConfig } from '../../config/types'
import { getPlatformLocalStorage } from '../../utils/localStorage'

import { HedgehogWalletClientConfigInternal } from './types'

export const getDefaultUserAuthConfig = (
  config: SdkServicesConfig
): HedgehogWalletClientConfigInternal => ({
  identityService: config.network.identityService,
  useLocalStorage: true,
  localStorage: getPlatformLocalStorage()
})
