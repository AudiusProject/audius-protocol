import { Cognito } from '@audius/common'

import { audiusBackendInstance } from './audius-backend-instance'

export const cognito = new Cognito({ audiusBackend: audiusBackendInstance })
