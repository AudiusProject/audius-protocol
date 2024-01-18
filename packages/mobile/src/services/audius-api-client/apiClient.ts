import { AudiusAPIClient } from '@audius/common'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { env } from 'app/env'
import { audiusLibs, waitForLibsInit } from 'app/services/libs'
import { localStorage } from 'app/services/local-storage'
import { remoteConfigInstance } from 'app/services/remote-config'

export const apiClient = new AudiusAPIClient({
  audiusBackendInstance,
  remoteConfigInstance,
  getAudiusLibs: () => audiusLibs,
  localStorage,
  env,
  waitForLibsInit
})
