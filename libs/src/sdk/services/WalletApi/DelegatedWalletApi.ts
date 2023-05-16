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
    () => {
      throw new Error('DelegatedWalletApi does not support getSharedSecret')
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error('DelegatedWalletApi does not support sign')
  }

  signTransaction = (
    data: MessageData<EIP712TypedData>['data'],
    userPublicKey?: string
  ) => {
    if (!userPublicKey) {
      throw new Error('No userPublicKey provided for delegated write')
    }

    const sharedSecret = secp.getSharedSecret(
      this.apiSecret,
      userPublicKey,
      true
    )

    return signTypedData(sharedSecret as Buffer, {
      data
    })
  }

  getAddress: () => Promise<string> = async () => {
    return this.apiKey
  }
}
