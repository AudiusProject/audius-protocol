/* eslint-disable @typescript-eslint/no-extraneous-class */
declare module '@audius/hedgehog' {
  import type Wallet from 'ethereumjs-wallet'
  import type { LocalStorage } from './utils/localStorage'

  type RecoveryInfo = {
    login: string
    host: string
  }

  type GetFn = (params: {
    lookupKey: string
    username: string
  }) =>
    | Promise<{ iv: string; cipherText: string }>
    | { iv: string; cipherText: string }

  type SetAuthFn = (params: {
    iv: string
    cipherText: string
    lookupKey: string
  }) => void | Promise<void>

  type SetUserFn = (params: {
    walletAddress: string
    username: string
  }) => void | Promise<void>

  export class Hedgehog {
    wallet: Wallet
    getFn: GetFn
    setAuthFn: SetAuthFn
    setUserFn: SetUserFn
    localStorage: LocalStorage
    isReady: boolean
    constructor(
      getFn: GetFn,
      setAuthFn: SetAuthFn,
      setUserFn: SetUserFn,
      useLocalStorage?: boolean,
      localStorage?: LocalStorage
    ): void
    isReady(): boolean
    async login(email: string, password: string): Promise<Wallet>
    async generateRecoveryInfo(): Promise<RecoveryInfo>
    getWallet(): Wallet
    async createWalletObj(passwordEntropy: string): Promise<Wallet>
  }

  export class WalletManager {
    static async createAuthLookupKey(
      email: string,
      password: string
    ): Promise<string>
    static async decryptCipherTextAndRetrieveWallet(
      password: string,
      iv: string,
      cipherText: string
    ): Promise<{ walletObj: Wallet; entropy: string }>
    static async getEntropyFromLocalStorage(
      localStorage: LocalStorage
    ): Promise<string>
    static async setEntropyInLocalStorage(
      entropy: string,
      localStorage: LocalStorage
    ): Promise<void>
  }
}
