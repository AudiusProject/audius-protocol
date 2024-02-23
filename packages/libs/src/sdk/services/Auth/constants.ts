import type { LocalStorage } from '@audius/hedgehog'

import { productionConfig } from '../../config'

import { AuthConfig } from './types'

/**
 * Fallback for localStorage that works in node and the browser
 * @returns localStorage
 */
export const getPlatformLocalStorage = async (): Promise<LocalStorage> => {
  if (typeof window === 'undefined' || window === null) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LocalStorage = (await import('node-localstorage')).LocalStorage
    return new LocalStorage('./local-storage')
  } else {
    return window.localStorage
  }
}

export const defaultHedgehogAuthConfig: AuthConfig = {
  identityService: productionConfig.identityServiceUrl,
  localStorage: getPlatformLocalStorage()
}
