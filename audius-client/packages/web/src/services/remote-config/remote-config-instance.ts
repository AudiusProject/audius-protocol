import optimizely from '@optimizely/optimizely-sdk'

import { remoteConfig } from 'common/services/remote-config/remote-config'

export const FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY = 'featureFlagSessionId'

export const remoteConfigInstance = remoteConfig({
  createOptimizelyClient: async () => {
    // Wait for optimizely to load if necessary (as it can be an async or defer tag)
    // @ts-ignore: injected in index.html
    if (!window.optimizelyDatafile) {
      let cb
      await new Promise((resolve) => {
        cb = resolve
        window.addEventListener('OPTIMIZELY_LOADED', cb)
      })
      if (cb) window.removeEventListener('OPTIMIZELY_LOADED', cb)
    }

    return optimizely.createInstance({
      // @ts-ignore: injected in index.html
      datafile: window.optimizelyDatafile
    })
  },
  getFeatureFlagSessionId: async () =>
    window.localStorage.getItem(FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY),
  setFeatureFlagSessionId: async (id) =>
    window.localStorage?.setItem(FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY, id),
  setLogLevel: () => optimizely.setLogLevel('warn')
})

remoteConfigInstance.init()
