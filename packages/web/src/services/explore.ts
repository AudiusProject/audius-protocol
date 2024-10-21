import { Explore } from '@audius/common/services'

import { audiusBackendInstance } from './audius-backend/audius-backend-instance'
import { audiusSdk } from './audius-sdk'

export const explore = new Explore({
  audiusBackendInstance,
  audiusSdk
})
