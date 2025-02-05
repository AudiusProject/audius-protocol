import { IdentityService } from '@audius/common/services'

import { env } from 'app/services/env'

import { getAudiusWalletClient } from './auth'

export const identityService = new IdentityService({
  identityServiceEndpoint: env.IDENTITY_SERVICE,
  getAudiusWalletClient
})
