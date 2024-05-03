import {
  developmentConfig,
  productionConfig,
  stagingConfig
} from '../../config'
import { Env } from '../../types/Env'
import { getPlatformLocalStorage } from '../../utils/localStorage'

import { UserAuthConfig } from './types'

export const defaultUserAuthConfig: Record<Env, UserAuthConfig> = {
  production: {
    identityService: productionConfig.identityServiceUrl,
    useLocalStorage: true,
    localStorage: getPlatformLocalStorage()
  },
  staging: {
    identityService: stagingConfig.identityServiceUrl,
    useLocalStorage: true,
    localStorage: getPlatformLocalStorage()
  },
  development: {
    identityService: developmentConfig.identityServiceUrl,
    useLocalStorage: true,
    localStorage: getPlatformLocalStorage()
  }
}
