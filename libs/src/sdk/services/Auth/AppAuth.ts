import { EIP712TypedData, MessageData, signTypedData } from 'eth-sig-util'
import { keccak_256 } from '@noble/hashes/sha3'
import type { AuthService } from './types'

/**
 * AuthService for Developer Apps wishing to write on a user's behalf
 */
export class AppAuth implements AuthService {
  private readonly apiKey: string
  private readonly apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    async () => {
      throw new Error('AppAuth does not support getSharedSecret')
    }

  sign: (data: string) => Promise<[Uint8Array, number]> = () => {
    throw new Error('AppAuth does not support sign')
  }

  signTransaction = async (data: MessageData<EIP712TypedData>['data']) => {
    return signTypedData(Buffer.from(this.apiSecret, 'hex'), {
      data
    })
  }

  getAddress: () => Promise<string> = async () => {
    const hash = keccak_256(Buffer.from(this.apiKey, 'hex'))
    return `0x${Buffer.from(hash.slice(-20)).toString('hex')}`
  }
}
