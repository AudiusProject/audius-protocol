import { signTypedData } from 'eth-sig-util'
import * as secp from '@noble/secp256k1'
import type { UsersApi } from '../../api/generated/default'
import type { WalletApiService } from './types'

export class DelegatedWalletApi implements WalletApiService {
  private apiKey: string
  private apiSecret: string
  private users?: UsersApi

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  setUsersApi(users: UsersApi) {
    this.users = users
  }

  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    () => {
      throw new Error('WalletApi not initialized')
    }

  sign = async (data: string, userId?: string) => {
    if (!userId) {
      throw new Error('No userId provided for delegated write')
    }

    if (!this.users) {
      throw new Error('Users API is not available')
    }

    const users = await this.users.getUser({ id: userId })
    const userPublicKey = users.data?.ercWallet

    if (!userPublicKey) {
      throw new Error(`Public key could not be found for user: ${userId}`)
    }

    const sharedSecret = secp.getSharedSecret(
      this.apiSecret,
      userPublicKey,
      true
    )

    return signTypedData(sharedSecret as Buffer, {
      data: data as any
    }) as any
  }

  getAddress: () => Promise<string> = async () => {
    return this.apiKey
  }
}
