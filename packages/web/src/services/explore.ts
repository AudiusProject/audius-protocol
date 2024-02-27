import { Explore } from '@audius/common/services'

import { apiClient } from './audius-api-client'
import { audiusBackendInstance } from './audius-backend/audius-backend-instance'
import { audiusSdk } from './audius-sdk'

export const explore = new Explore({
  audiusBackendInstance,
  apiClient,
  audiusSdk
})
