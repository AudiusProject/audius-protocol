import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CommonStoreContext } from 'audius-client/src/common/store'

import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { remoteConfigInstance } from 'app/services/remote-config'

export const storeContext: CommonStoreContext = {
  getLocalStorageItem: async (key) => AsyncStorage.getItem(key),
  setLocalStorageItem: async (key, value) => AsyncStorage.setItem(key, value),
  remoteConfigInstance,
  audiusBackendInstance,
  apiClient
}
