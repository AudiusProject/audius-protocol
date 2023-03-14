import type { Environment } from '@audius/common'
import { ErrorLevel, remoteConfig } from '@audius/common'
import * as optimizely from '@optimizely/optimizely-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { LocalPackage } from 'react-native-code-push'
import codePush from 'react-native-code-push'
import Config from 'react-native-config'
import VersionNumber from 'react-native-version-number'

import { reportToSentry } from 'app/utils/reportToSentry'

import packageInfo from '../../../package.json'

export const FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY = 'featureFlagSessionId-2'

const { version: appVersion } = packageInfo

const OPTIMIZELY_KEY = Config.OPTIMIZELY_KEY
const DATA_FILE_URL = 'https://experiments.audius.co/datafiles/%s.json'

/** Returns version in the form of `a1.1.33+codepush:v5` if Android, `i1.1.33+codepush:v5` if iOS. The `+codepush:*` portion is omitted if there is no CodePush update installed. */
const getMobileClientVersion = async () => {
  const baseVersion = `${Platform.OS === 'android' ? 'a' : 'i'}${
    VersionNumber.appVersion
  }`
  let res = baseVersion // This is our default value if getting the CodePush update metadata fails for some reason, or if there is no CodePush update installed.
  let codePushUpdateMetadata: LocalPackage | null
  try {
    codePushUpdateMetadata = await codePush.getUpdateMetadata()
  } catch (e) {
    console.error(
      'Error getting CodePush metadata for remote config instance.',
      e
    )
    return res
  }
  if (codePushUpdateMetadata) {
    res = `${baseVersion}+codepush:${codePushUpdateMetadata.label}`
  }
  return res
}

export const remoteConfigInstance = remoteConfig({
  appVersion,
  getMobileClientVersion,
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
