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

const ensureHex = (str: string): Hex =>
  str.startsWith('0x') ? (str as Hex) : `0x${str}`

export const createAppWalletClient = ({
  apiKey,
  apiSecret
}: {
  apiKey: string
  apiSecret?: string
}): AudiusWalletClient => {
  if (apiSecret) {
    return createClient({
      name: 'Audius App',
      type: 'audius',
      account: privateKeyToAudiusAccount(ensureHex(apiSecret)),
      transport: custom(localTransport())
    }).extend(audiusWalletActions)
  } else {
    return createClient<CustomTransport, undefined, AudiusAccount>({
      name: 'Audius Readonly App',
      type: 'audius',
      account: {
        address: ensureHex(apiKey),
        type: 'local'
      } as LocalAccount<'custom'>,
      transport: custom(localTransport())
    }).extend(audiusWalletActions)
  }
}
