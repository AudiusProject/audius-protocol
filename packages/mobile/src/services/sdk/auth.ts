import { createAuthService } from '@audius/common/services'
import { createHedgehogWalletClient } from '@audius/sdk'

import { env } from 'app/env'

import { createPrivateKey } from '../createPrivateKey'
import { localStorage } from '../local-storage'

export const authService = createAuthService({
  localStorage,
  identityServiceEndpoint: env.IDENTITY_SERVICE,
  createKey: createPrivateKey
})

export const audiusWalletClient = createHedgehogWalletClient(
  authService.hedgehogInstance
)
