import { AudiusAPIClient } from '@audius/common'

import { audiusBackendInstance } from '../audius-backend-instance'
import { env } from '../env'
import { audiusLibs, waitForLibsInit } from '../libs'
import { localStorage } from '../local-storage'
import { remoteConfigInstance } from '../remote-config'

export const apiClient = new AudiusAPIClient({
  audiusBackendInstance,
  remoteConfigInstance,
  getAudiusLibs: () => audiusLibs,
  localStorage,
  env,
  waitForLibsInit
})
