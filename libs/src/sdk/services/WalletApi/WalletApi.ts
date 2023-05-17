import type { TransactionData, WalletApiService } from './types'

export class WalletApi implements WalletApiService {
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
