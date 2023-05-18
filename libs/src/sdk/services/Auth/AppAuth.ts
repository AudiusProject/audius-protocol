import { EIP712TypedData, MessageData, signTypedData } from 'eth-sig-util'
import * as secp from '@noble/secp256k1'
import type { AuthService } from './types'

export class AppAuth implements AuthService {
  private apiKey: string
  private apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    async (publicKey) => {
      return secp.getSharedSecret(this.apiSecret, publicKey, true)
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error('DelegatedWalletApi does not support sign')
  }

  signTransaction = async (data: MessageData<EIP712TypedData>['data']) => {
    return signTypedData(Buffer.from(this.apiSecret, 'hex'), {
      data
    })
  }

  getAddress: () => Promise<string> = async () => {
    return this.apiKey
  }
}
