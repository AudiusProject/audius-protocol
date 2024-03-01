import { LocalStorage } from '@audius/hedgehog'
import type { EIP712TypedData, MessageData } from 'eth-sig-util'

export type TransactionData = MessageData<EIP712TypedData>['data']

export type AuthService = {
  /**
   * Get a shared secret, used for Chats
   */
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array>
  /**
   * Sign some data, used for Chats
   */
  sign: (data: string | Uint8Array) => Promise<[Uint8Array, number]>
  /**
   * Hash and sign some data
   */
  hashAndSign: (data: string) => Promise<string>
  /**
   * Sign an ethereum transaction, used for EntityManager writes
   * NOTE: audius-client can stub out until we use sdk for writes in the client
   */
  signTransaction: (data: TransactionData) => Promise<string>
  /**
   * Get the sender address, used for EntityManager writes
   */
  getAddress: () => Promise<string>
}

export type UserAuthConfig = {
  /**
   * The identity service that backs hedgehog authentication
   */
  identityService: string

  /**
   * Whether hedgehog uses local storage to keep user sessions
   */
  useLocalStorage: boolean

  /**
   * An interface to local storage provided to hedgehog
   */
  localStorage: Promise<LocalStorage>
}
