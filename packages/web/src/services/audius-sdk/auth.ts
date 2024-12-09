import { createAuthService } from '@audius/common/services'
import { createHedgehogWalletClient } from '@audius/sdk'

import { localStorage } from '../local-storage'

import { identityService } from './identity'

export const authService = createAuthService({
  localStorage,
  identityService
})

export const audiusWalletClient = createHedgehogWalletClient(
  authService.hedgehogInstance
)
