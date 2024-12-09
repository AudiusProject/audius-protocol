import {
  createClient,
  custom,
  type CustomTransport,
  type Hex,
  type LocalAccount
} from 'viem'

import { audiusWalletActions } from './decorators/audiusWallet'
import { localTransport } from './localTransport'
import { privateKeyToAudiusAccount } from './privateKeyToAudiusAccount'
import type { AudiusAccount, AudiusWalletClient } from './types'

export const createAppWalletClient = (
  apiKey: Hex,
  apiSecret?: Hex
): AudiusWalletClient => {
  if (apiSecret) {
    return createClient({
      name: 'Audius App',
      type: 'audius',
      account: privateKeyToAudiusAccount(apiSecret),
      transport: custom(localTransport())
    }).extend(audiusWalletActions)
  } else {
    return createClient<CustomTransport, undefined, AudiusAccount>({
      name: 'Audius Readonly App',
      type: 'audius',
      account: { address: apiKey, type: 'local' } as LocalAccount<'custom'>,
      transport: custom(localTransport())
    }).extend(audiusWalletActions)
  }
}
