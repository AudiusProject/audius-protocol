export type LocalStorage = {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}

export type PrivateKey = { keyHex: string; keyBuffer: Uint8Array }

export type CreateKey = (
  encryptStr: string,
  ivHex: string
) => Promise<PrivateKey>

/**
 * The subset of the ethereumjs-wallet `Wallet` API that the apps use.
 */
export type EthWallet = {
  /** 32-byte secp256k1 private key */
  getPrivateKey: () => Uint8Array
  /** 0x-prefixed lowercase hex private key */
  getPrivateKeyString: () => string
  /** 64-byte uncompressed public key without the 0x04 prefix */
  getPublicKey: () => Uint8Array
  /** 0x-prefixed lowercase hex public key (64 bytes) */
  getPublicKeyString: () => string
  /** 20-byte address */
  getAddress: () => Uint8Array
  /** 0x-prefixed lowercase hex address */
  getAddressString: () => string
  /** 0x-prefixed EIP-55 checksummed address */
  getChecksumAddressString: () => string
}

export type GetFn = (params: {
  lookupKey: string
  [key: string]: unknown
}) =>
  | Promise<{ iv: string; cipherText: string }>
  | { iv: string; cipherText: string }

export type SetAuthFn = (params: {
  iv: string
  cipherText: string
  lookupKey: string
  wallet: EthWallet
  oldLookupKey?: string
  [key: string]: unknown
}) => any | Promise<any>

export type SetUserFn = (params: {
  walletAddress: string
  username: string
  [key: string]: unknown
}) => any | Promise<any>

export type LoginArgs = {
  username: string
  password: string
  [key: string]: unknown
}

export type ChangeCredentialsArgs = {
  newUsername: string
  newPassword: string
  oldUsername: string
  oldPassword: string
  [key: string]: unknown
}
