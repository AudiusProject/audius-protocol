import * as optimizely from '@optimizely/react-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { remoteConfig } from 'audius-client/src/common/services/remote-config'
import Config from 'react-native-config'

export const FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY = 'featureFlagSessionId'

export const remoteConfigInstance = remoteConfig({
  createOptimizelyClient: async () => {
    return optimizely.createInstance({
      sdkKey: Config.OPTIMIZELY_KEY
    })
  },
  getFeatureFlagSessionId: async () =>
    AsyncStorage.getItem(FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY),
  setFeatureFlagSessionId: async (id) =>
    AsyncStorage.setItem(FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY, id),
  setLogLevel: () => optimizely.setLogLevel('warn')
})

remoteConfigInstance.init()
