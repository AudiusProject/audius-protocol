import { AudiusAPIClient } from '@audius/common/services'

import { env } from 'app/env'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { localStorage } from 'app/services/local-storage'
import { remoteConfigInstance } from 'app/services/remote-config'

export const apiClient = new AudiusAPIClient({
  audiusBackendInstance,
  remoteConfigInstance,
  localStorage,
  env,
  appName: env.APP_NAME,
  apiKey: env.API_KEY
})
