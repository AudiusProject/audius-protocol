import { CommonStoreContext } from 'common/store'
import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { fingerprintClient } from 'services/fingerprint'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

export const storeContext: CommonStoreContext = {
  getLocalStorageItem: async (key) => window.localStorage.getItem(key),
  setLocalStorageItem: async (key, value) =>
    window.localStorage.setItem(key, value),
  remoteConfigInstance,
  audiusBackendInstance,
  apiClient,
  fingerprintClient
}
