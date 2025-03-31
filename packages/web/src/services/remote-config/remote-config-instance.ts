import { ErrorLevel } from '@audius/common/models'
import { remoteConfig } from '@audius/common/services'
import optimizely, { Config } from '@optimizely/optimizely-sdk'
import { isEmpty } from 'lodash'

import { env } from 'services/env'
import { reportToSentry } from 'store/errors/reportToSentry'
import { isElectron } from 'utils/clientUtil'

import packageInfo from '../../../package.json'

const { version: appVersion } = packageInfo

declare global {
  interface Window {
    optimizelyDatafile: Config['datafile']
  }
}

const FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY = 'featureFlagSessionId-2'

export const remoteConfigInstance = remoteConfig({
  appVersion,
  platform: isElectron() ? 'desktop' : 'web',
  createOptimizelyClient: async () => {
    // Wait for optimizely to load if necessary (as it can be an async or defer tag)
    if (!window.optimizelyDatafile) {
      let cb
      await new Promise((resolve) => {
        cb = resolve
        window.addEventListener('OPTIMIZELY_LOADED', cb)
      })
      if (cb) window.removeEventListener('OPTIMIZELY_LOADED', cb)
    }

    const datafile = window.optimizelyDatafile
    if (isEmpty(datafile)) {
      reportToSentry({
        level: ErrorLevel.Error,
        error: new Error('Optimizely failed to load')
      })
    }

    return optimizely.createInstance({
      datafile,
      errorHandler: {
        handleError: (error) => {
          reportToSentry({
            level: ErrorLevel.Error,
            error
          })
        }
      }
    })
  },
  getFeatureFlagSessionId: async () => {
    const item = window.localStorage.getItem(
      FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY
    )
    return item ? parseInt(item) : null
  },
  setFeatureFlagSessionId: async (id: number) =>
    window.localStorage?.setItem(
      FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY,
      id.toString()
    ),
  setLogLevel: () => optimizely.setLogLevel('warn'),
  environment: env.ENVIRONMENT
})
