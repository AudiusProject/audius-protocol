import {
  createAuthService,
  createHedgehogSolanaWalletService
} from '@audius/common/services'
import { createHedgehogWalletClient } from '@audius/sdk'

import { env } from '../env'
import { localStorage } from '../local-storage'

export const authService = createAuthService({
  localStorage,
  identityServiceEndpoint: env.IDENTITY_SERVICE
})

export const audiusWalletClient = createHedgehogWalletClient(
  authService.hedgehogInstance
)

export const solanaWalletService = createHedgehogSolanaWalletService(
  authService.hedgehogInstance
)
