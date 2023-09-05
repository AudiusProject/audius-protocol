import { remoteConfig } from '@audius/common'
import optimizely from '@optimizely/optimizely-sdk'

export const FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY = 'featureFlagSessionId-2'

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
  setLogLevel: () => optimizely.setLogLevel('warn')
})

remoteConfigInstance.init()
