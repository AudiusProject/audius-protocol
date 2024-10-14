import { SignTypedDataVersion, signTypedData } from '@metamask/eth-sig-util'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'

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

  sign: (data: string | Uint8Array) => Promise<[Uint8Array, number]> = async (
    data
  ) => {
    return secp.sign(keccak_256(data), this.apiSecret, {
      recovered: true,
      der: false
    })
  }

  hashAndSign: (data: string) => Promise<string> = () => {
    throw new Error('AppAuth does not support hashAndSign')
  }

  // TODO: replace this with a typed version of signature schemas
  signTransaction = async (data: any) => {
    if (!this.apiSecret) {
      throw new Error(
        'AppAuth cannot `signTransaction` because apiSecret was not provided when initializing the SDK.'
      )
    }
    return await signTypedData({
      privateKey: Buffer.from(this.apiSecret, 'hex'),
      data: data as any,
      version: SignTypedDataVersion.V3
    })
  }

  getAddress: () => Promise<string> = async () => {
    return `0x${this.apiKey}`
  }
}
