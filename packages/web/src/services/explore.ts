import { Explore } from '@audius/common/schemas'

import { apiClient } from './audius-api-client'
import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

export const explore = new Explore({
  audiusBackendInstance,
  apiClient
})
