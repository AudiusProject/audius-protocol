import { AudiusAPIClient } from 'common/services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { env } from 'services/env'
import { localStorage } from 'services/local-storage'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

export const apiClient = new AudiusAPIClient({
  audiusBackendInstance,
  remoteConfigInstance,
  audiusLibs: window.audiusLibs,
  localStorage,
  env
})
