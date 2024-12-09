import { IdentityService } from '@audius/common/services'

import { env } from 'app/env'

export const identityService = new IdentityService({
  identityServiceEndpoint: env.IDENTITY_SERVICE
})
