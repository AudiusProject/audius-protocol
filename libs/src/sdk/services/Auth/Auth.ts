import type { TransactionData, AuthService } from './types'

const NOT_INITIALIZED =
  'Auth not initialized - Please provide an apiKey and apiSecret, or a custom implementation of Auth'

export class Auth implements AuthService {
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    () => {
      throw new Error(NOT_INITIALIZED)
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error(NOT_INITIALIZED)
  }

  hashAndSign: (data: string) => Promise<string> = () => {
    throw new Error('Auth not initialized')
  }

  signTransaction: (data: TransactionData) => Promise<string> = () => {
    throw new Error(NOT_INITIALIZED)
  }

  getAddress: () => Promise<string> = () => {
    throw new Error(NOT_INITIALIZED)
  }
}
