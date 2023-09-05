import { Cognito } from '@audius/common'

import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

export const cognito = new Cognito({ audiusBackend: audiusBackendInstance })
