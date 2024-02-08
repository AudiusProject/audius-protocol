import { Explore } from '@audius/common/services'

import { apiClient } from './audius-api-client'
import { audiusBackendInstance } from './audius-backend-instance'

export const explore = new Explore({
  audiusBackendInstance,
  apiClient
})
