import { Env } from '../../types/Env'
import { getPlatformLocalStorage } from '../../utils/localStorage'

import { UserAuthConfig } from './types'

export const defaultUserAuthConfig: Record<Env, UserAuthConfig> = {
  production: {
    identityService: 'https://identityservice.audius.co',
    useLocalStorage: true,
    localStorage: getPlatformLocalStorage()
  },
  staging: {
    identityService: 'https://identityservice.staging.audius.co',
    useLocalStorage: true,
    localStorage: getPlatformLocalStorage()
  },
  development: {
    identityService: 'https://audius-protocol-identity-service-1',
    useLocalStorage: true,
    localStorage: getPlatformLocalStorage()
  }
}
