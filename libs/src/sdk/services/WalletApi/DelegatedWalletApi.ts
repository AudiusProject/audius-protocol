import { EIP712TypedData, MessageData, signTypedData } from 'eth-sig-util'
import * as secp from '@noble/secp256k1'
import type { WalletApiService } from './types'

export class DelegatedWalletApi implements WalletApiService {
  private apiKey: string
  private apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    async (publicKey) => {
      console.log('publicKey', publicKey)
      return secp.getSharedSecret(this.apiSecret, publicKey, true)
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error('DelegatedWalletApi does not support sign')
  }

  signTransaction = async (
    data: MessageData<EIP712TypedData>['data'],
    userPublicKey?: string
  ) => {
    if (!userPublicKey) {
      throw new Error('No userPublicKey provided for delegated write')
    }

    const sharedSecret = (await this.getSharedSecret(userPublicKey)) as Buffer

    return signTypedData(sharedSecret, {
      data
    })
  }

  getAddress: () => Promise<string> = async () => {
    return this.apiKey
  }
}
