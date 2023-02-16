import { FeatureFlags } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAsync } from 'react-use'

import { useFeatureFlag } from './useRemoteConfig'

const OFFLINE_OVERRIDE_ASYNC_STORAGE_KEY = 'offline_mode_release_local_override'

// DO NOT CHECK IN VALUE: true
const hardCodeOverride = false
let asyncOverride = false

export const toggleLocalOfflineModeOverride = () => {
  asyncOverride = !asyncOverride
  AsyncStorage.setItem(
    OFFLINE_OVERRIDE_ASYNC_STORAGE_KEY,
    asyncOverride.toString()
  )
  alert(`Offline mode ${asyncOverride ? 'enabled' : 'disabled'}`)
}

export const useReadOfflineOverride = () =>
  useAsync(async () => {
    try {
      asyncOverride =
        (await AsyncStorage.getItem(OFFLINE_OVERRIDE_ASYNC_STORAGE_KEY)) ===
        'true'
    } catch (e) {
      console.log('error reading local offline mode override')
    }
  })

// TODO: remove helpers when feature is shipped
export const useIsOfflineModeEnabled = () =>
  useFeatureFlag(FeatureFlags.OFFLINE_MODE_RELEASE).isEnabled ||
  asyncOverride ||
  hardCodeOverride
