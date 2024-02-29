import { productionConfig } from '../../config'
import { getPlatformLocalStorage } from '../../utils/localStorage'

import { AuthConfig } from './types'

export const defaultHedgehogAuthConfig: AuthConfig = {
  identityService: productionConfig.identityServiceUrl,
  localStorage: getPlatformLocalStorage()
}
