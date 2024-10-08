import { IdentityService } from '@audius/common/services'

import { env } from '../env'

export const identityServiceInstance = new IdentityService({
  identityServiceEndpoint: env.IDENTITY_SERVICE
})
