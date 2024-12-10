import { IdentityService } from '@audius/common/services'

import { env } from '../env'

export const identityService = new IdentityService({
  identityServiceEndpoint: env.IDENTITY_SERVICE
})
