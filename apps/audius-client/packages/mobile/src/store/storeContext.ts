import type { CommonStoreContext } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'

import * as analytics from 'app/services/analytics'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { env } from 'app/services/env'
import { explore } from 'app/services/explore'
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
  analytics,
  remoteConfigInstance,
  audiusBackendInstance,
  apiClient,
  fingerprintClient,
  walletClient,
  localStorage,
  isNativeMobile: true,
  env,
  explore
}
