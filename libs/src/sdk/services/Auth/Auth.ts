import type { TransactionData, AuthService } from './types'

/**
 * AuthService for Developer Apps wishing to write on a user's behalf
 */
export class Auth implements AuthService {
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    () => {
      throw new Error('WalletApi not initialized')
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error('WalletApi not initialized')
  }

  signTransaction: (data: TransactionData) => Promise<string> = () => {
    throw new Error('WalletApi not initialized')
  }

  getAddress: () => Promise<string> = () => {
    throw new Error('WalletApi not initialized')
  }
}
