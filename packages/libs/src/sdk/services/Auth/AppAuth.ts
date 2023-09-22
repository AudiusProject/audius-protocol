import { EIP712TypedData, MessageData, signTypedData } from 'eth-sig-util'

import type { AuthService } from './types'

/**
 * AuthService for Developer Apps wishing to write on a user's behalf
 */
export class AppAuth implements AuthService {
  private readonly apiKey: string
  private readonly apiSecret: string | null

  constructor(apiKey: string, apiSecret?: string | null) {
    this.apiKey = apiKey.replace(/^0x/, '')
    if (apiSecret) {
      this.apiSecret = apiSecret.replace(/^0x/, '')
    } else {
      this.apiSecret = null
    }
  }

  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    async () => {
      throw new Error('AppAuth does not support getSharedSecret')
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error('AppAuth does not support sign')
  }

  hashAndSign: (data: string) => Promise<string> = () => {
    throw new Error('AppAuth does not support hashAndSign')
  }

  signTransaction = async (data: MessageData<EIP712TypedData>['data']) => {
    if (!this.apiSecret) {
      throw new Error(
        'AppAuth cannot `signTransaction` because apiSecret was not provided when initializing the SDK.'
      )
    }
    return signTypedData(Buffer.from(this.apiSecret, 'hex'), {
      data
    })
  }

  getAddress: () => Promise<string> = async () => {
    return `0x${this.apiKey}`
  }
}
