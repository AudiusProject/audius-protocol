import type { TransactionData, AuthService } from './types'

export class Auth implements AuthService {
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    () => {
      throw new Error('Auth not initialized')
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error('Auth not initialized')
  }

  hashAndSign: (data: string) => Promise<string> = () => {
    throw new Error('Auth not initialized')
  }

  signTransaction: (data: TransactionData) => Promise<string> = () => {
    throw new Error('Auth not initialized')
  }

  getAddress: () => Promise<string> = () => {
    throw new Error('Auth not initialized')
  }
}
