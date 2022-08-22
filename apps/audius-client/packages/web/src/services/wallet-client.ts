import { WalletClient } from '@audius/common'

import { apiClient } from './audius-api-client'
import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

export const walletClient = new WalletClient({
  audiusBackendInstance,
  apiClient
})
