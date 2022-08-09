import { RemoteConfigInstance } from '@audius/common'

import { AudiusAPIClient } from 'common/services/audius-api-client'
import { AudiusBackend } from 'common/services/audius-backend'

export type CommonStoreContext = {
  getLocalStorageItem: (key: string) => Promise<string | null>
  setLocalStorageItem: (key: string, value: string) => Promise<void>
  remoteConfigInstance: RemoteConfigInstance
  audiusBackendInstance: AudiusBackend
  apiClient: AudiusAPIClient
}
