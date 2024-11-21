import type { LocalStorage } from '@audius/hedgehog'
import type { Hex, TransactionType } from 'viem'

export type TypedData = {
  domain?: Partial<{
    name: string
    version: string
    chainId: bigint
    verifyingContract: string
  }>
  types: Record<string, Readonly<Array<{ name: string; type: string }>>>
  primaryType: string
  message: Record<string, any>
}

export type TransactionRequest = {
  type?: TransactionType
  data?: Hex
  gas?: bigint
  nonce?: number
  to?: Hex
  value?: bigint
}

export type AudiusWalletClient = {
  /**
   * Get a shared secret, used for Chats
   */
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array>
  /**
   * Signs the keccak hash of some data, used for Chats
   */
  sign: (data: string | Uint8Array) => Promise<[Uint8Array, number]>
  /**
   * Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
   */
  signMessage: (message: string) => Promise<string>
  /**
   * Signs typed data and calculates an Ethereum-specific signature in [EIP-712 format](https://eips.ethereum.org/EIPS/eip-712): `sign(keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message)))`
   */
  signTypedData: (data: TypedData) => Promise<string>
  /**
   * Sends a transaction
   */
  sendTransaction: (data: TransactionRequest) => Promise<string>
  /**
   * Get the sender address, used for EntityManager writes
   */
  getAddress: () => Promise<string>
}

export type HedgehogWalletClientConfigInternal = {
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

export type UserAuthConfig = Partial<HedgehogWalletClientConfigInternal>
