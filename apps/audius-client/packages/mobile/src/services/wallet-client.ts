import { WalletClient } from 'common/services/wallet-client'

import { apiClient } from './audius-api-client'
import { audiusBackendInstance } from './audius-backend-instance'

export const walletClient = new WalletClient({
  audiusBackendInstance,
  apiClient
})
