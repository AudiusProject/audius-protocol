import { EIP712TypedData, MessageData, signTypedData } from 'eth-sig-util'
import type { AuthService } from './types'

/**
 * AuthService for Developer Apps wishing to write on a user's behalf
 */
export class AppAuth implements AuthService {
  private readonly apiKey: string
  private readonly apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey.replace(/^0x/, '')
    this.apiSecret = apiSecret.replace(/^0x/, '')
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
    return signTypedData(Buffer.from(this.apiSecret, 'hex'), {
      data
    })
  }

  getAddress: () => Promise<string> = async () => {
    return `0x${this.apiKey}`
  }
}
