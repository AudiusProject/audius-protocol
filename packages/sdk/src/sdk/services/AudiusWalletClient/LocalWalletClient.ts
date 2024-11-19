import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'
import {
  createWalletClient,
  http,
  type Chain,
  type Hex,
  type HttpTransport,
  type PrivateKeyAccount,
  type SendTransactionParameters,
  type SignTypedDataParameters,
  type WalletClient
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import type { AudiusWalletClient, TransactionRequest, TypedData } from './types'

/**
 * A wallet client implementation using the inputted secret key.
 */
export class LocalWalletClient implements AudiusWalletClient {
  private readonly privateKey: string
  private readonly walletClient: WalletClient<
    HttpTransport,
    Chain,
    PrivateKeyAccount
  >

  constructor(privateKey: string) {
    if (privateKey.startsWith('0x')) {
      this.privateKey = privateKey.substring(2)
      const account = privateKeyToAccount(privateKey as Hex)
      this.walletClient = createWalletClient({ account, transport: http() })
    } else {
      throw new Error('Invalid private key.')
    }
  }

  getSharedSecret = async (publicKey: string | Uint8Array) => {
    return secp.getSharedSecret(this.privateKey, publicKey)
  }

  sign: (data: string | Uint8Array) => Promise<[Uint8Array, number]> = async (
    data
  ) => {
    return secp.sign(keccak_256(data), this.privateKey, {
      recovered: true,
      der: false
    })
  }

  signMessage = async (message: string) => {
    return await this.walletClient.signMessage({ message })
  }

  signTypedData = async (data: TypedData) => {
    return await this.walletClient.signTypedData(
      data as SignTypedDataParameters
    )
  }

  sendTransaction = async (transaction: TransactionRequest) => {
    return await this.walletClient.sendTransaction(
      transaction as SendTransactionParameters
    )
  }

  getAddress: () => Promise<string> = async () => {
    return this.walletClient.account.address
  }
}
