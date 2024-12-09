import { createAuthService } from '@audius/common/services'
import { createHedgehogWalletClient } from '@audius/sdk'

import { localStorage } from '../local-storage'

import { identityServiceInstance } from './identity'

export const authService = createAuthService({
  localStorage,
  identityService: identityServiceInstance
})

export const audiusWalletClient = createHedgehogWalletClient(
  authService.hedgehogInstance
)
