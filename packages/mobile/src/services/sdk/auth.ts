import { createAuthService } from '@audius/common/services'

import { createPrivateKey } from '../createPrivateKey'
import { localStorage } from '../local-storage'

import { identityServiceInstance } from './identity'

export const authService = createAuthService({
  localStorage,
  identityService: identityServiceInstance,
  createKey: createPrivateKey
})
