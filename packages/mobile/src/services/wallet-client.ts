import { WalletClient } from '@audius/common/services'

import { apiClient } from './audius-api-client'
import { audiusBackendInstance } from './audius-backend-instance'

export const walletClient = new WalletClient({
  audiusBackendInstance,
  apiClient
})
