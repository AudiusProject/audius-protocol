import { AudiusAPIClient } from 'audius-client/src/common/services/audius-api-client'

import { audiusBackendInstance, audiusLibs } from '../audius-backend-instance'
import { remoteConfigInstance } from '../remote-config'

export const apiClient = new AudiusAPIClient({
  audiusBackendInstance,
  remoteConfigInstance,
  audiusLibs
})
