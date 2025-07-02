import { ErrorLevel } from '@audius/common/models'
import type { Environment } from '@audius/common/services'
import { remoteConfig } from '@audius/common/services'
import * as optimizely from '@optimizely/optimizely-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import Config from 'react-native-config'
import VersionNumber from 'react-native-version-number'

import { env } from 'app/services/env'
import { reportToSentry } from 'app/utils/reportToSentry'

import packageInfo from '../../../package.json'

export const FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY = 'featureFlagSessionId-2'

const { version: appVersion } = packageInfo

const OPTIMIZELY_KEY = env.OPTIMIZELY_KEY
const DATA_FILE_URL = 'https://experiments.audius.co/datafiles/%s.json'

const getMobileClientInfo = async () => {
  const mobilePlatform = Platform.OS
  const mobileAppVersion = VersionNumber.appVersion

  return {
    mobilePlatform,
    mobileAppVersion
  }
}

export const remoteConfigInstance = remoteConfig({
  appVersion,
  platform: 'mobile',
  getMobileClientInfo,
  createOptimizelyClient: async () => {
    return optimizely.createInstance({
      sdkKey: OPTIMIZELY_KEY,
      datafileOptions: {
        urlTemplate: DATA_FILE_URL
      },
      errorHandler: {
        handleError: (error) => {
          reportToSentry({
            level: ErrorLevel.Error,
            error,
            name: 'Optimizely failed to load'
          })
        }
      }
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
  setLogLevel: () => optimizely.setLogLevel('warn'),
  environment: Config.ENVIRONMENT as Environment
})

remoteConfigInstance.init()
