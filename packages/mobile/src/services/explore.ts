import { Explore } from '@audius/common/services'

import { audiusBackendInstance } from './audius-backend-instance'
import { audiusSdk } from './sdk/audius-sdk'

export const explore = new Explore({
  audiusBackendInstance,
  audiusSdk
})
