import { remoteConfig } from '@audius/common'
// eslint-disable-next-line import/no-unresolved -- this module needs to come from web to work for some reason
import * as optimizely from '@optimizely/optimizely-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Config from 'react-native-config'

export const FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY = 'featureFlagSessionId-2'

export const remoteConfigInstance = remoteConfig({
  createOptimizelyClient: async () => {
    return optimizely.createInstance({
      sdkKey: Config.OPTIMIZELY_KEY
    })
  },
  getFeatureFlagSessionId: async () => {
    const sessionId = await AsyncStorage.getItem(
      FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY
    )
    return sessionId ? parseInt(sessionId) : null
  },
  setFeatureFlagSessionId: async (id) =>
    AsyncStorage.setItem(FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY, id.toString()),
  setLogLevel: () => optimizely.setLogLevel('warn')
})

remoteConfigInstance.init()
