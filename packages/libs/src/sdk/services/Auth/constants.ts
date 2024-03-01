import { productionConfig } from '../../config'
import { getPlatformLocalStorage } from '../../utils/localStorage'

import { UserAuthConfig } from './types'

export const defaultUserAuthConfig: UserAuthConfig = {
  identityService: productionConfig.identityServiceUrl,
  useLocalStorage: true,
  localStorage: getPlatformLocalStorage()
}
