import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CommonStoreContext } from 'audius-client/src/common/store'

import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { fingerprintClient } from 'app/services/fingerprint'
import { localStorage } from 'app/services/local-storage'
import {
  getFeatureEnabled,
  remoteConfigInstance
} from 'app/services/remote-config'
import { walletClient } from 'app/services/wallet-client'

export const storeContext: CommonStoreContext = {
  getLocalStorageItem: async (key) => AsyncStorage.getItem(key),
  setLocalStorageItem: async (key, value) => AsyncStorage.setItem(key, value),
  getFeatureEnabled,
  remoteConfigInstance,
  audiusBackendInstance,
  apiClient,
  fingerprintClient,
  walletClient,
  localStorage,
  isNativeMobile: true
}
