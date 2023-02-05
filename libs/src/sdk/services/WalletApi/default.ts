import { RequiredError } from '../../api/generated/default'
import type { WalletApiService } from './types'

/**
 * Default wallet API which is used to surface errors when the walletApi is not configured
 */
export const defaultWalletApi: WalletApiService = {
  getSharedSecret: async (_: string | Uint8Array): Promise<Uint8Array> => {
    throw new RequiredError(
      'Wallet API configuration missing. This method requires using the walletApi config for write access.'
    )
  },
  sign: async (_: string): Promise<[Uint8Array, number]> => {
    throw new RequiredError(
      'Wallet API configuration missing. This method requires using the walletApi config for write access.'
    )
  }
}
