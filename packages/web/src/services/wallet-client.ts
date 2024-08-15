import { WalletClient } from '@audius/common/services'

import { apiClient } from './audius-api-client'
import { audiusBackendInstance } from './audius-backend/audius-backend-instance'
import { audiusSdk } from './audius-sdk'

export const walletClient = new WalletClient({
  audiusBackendInstance,
  apiClient,
  audiusSdk
})
