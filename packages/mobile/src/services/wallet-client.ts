import { WalletClient } from '@audius/common/services'

import { audiusBackendInstance } from './audius-backend-instance'
import { audiusSdk } from './sdk/audius-sdk'

export const walletClient = new WalletClient({
  audiusBackendInstance,
  audiusSdk
})
