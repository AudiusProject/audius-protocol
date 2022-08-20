import { AudiusAPIClient } from 'audius-client/src/common/services/audius-api-client'

import { audiusBackendInstance, audiusLibs } from '../audius-backend-instance'
import { env } from '../env'
import { localStorage } from '../local-storage'
import { remoteConfigInstance } from '../remote-config'

export const apiClient = new AudiusAPIClient({
  audiusBackendInstance,
  remoteConfigInstance,
  audiusLibs,
  localStorage,
  env
})
