import type { EIP712TypedData, MessageData } from 'eth-sig-util'

export type TransactionData = MessageData<EIP712TypedData>['data']

export type WalletApiService = {
  /**
   * Get a shared secret, used for Chats
   */
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array>
  /**
   * Sign some data, used for Chats
   */
  sign: (data: string) => Promise<[Uint8Array, number]>
  /**
   * Sign an ethereum transaction, used for EntityManager writes
   */
  signTransaction: (data: TransactionData, userPublicKey?: string) => string
  /**
   * Get the sender address, used for EntityManager writes
   */
  getAddress: () => Promise<string>
}
