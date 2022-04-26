/* eslint-disable @typescript-eslint/no-extraneous-class */
declare module '@audius/hedgehog' {
  import { IdentityService } from '../../src/services/identity'

  type RecoveryInfo = {
    login: string
    host: string
  }

  type Wallet = Record<string, unknown>

  export class Hedgehog {
    wallet: Wallet
    getFn: IdentityService['getFn']
    setAuthFn: IdentityService['setAuthFn']
    setUserFn: IdentityService['setUserFn']
    identityService: IdentityService
    constructor(
      getFn: IdentityService['getFn'],
      setAuthFn: IdentityService['setAuthFn'],
      setUserFn: IdentityService['setUserFn'],
      useLocalStorage: boolean
    ): void
    async login(email: string, password: string): Promise<Wallet>
    async generateRecoveryInfo(): Promise<RecoveryInfo>
    getWallet(): string
  }

  export class WalletManager {
    static async createAuthLookupKey(email: string, password: string)
    static async decryptCipherTextAndRetrieveWallet(
      password: string,
      iv: string,
      cipherText: string
    ): Promise<{ walletObj: Wallet; entropy: string }>
    static async getEntropyFromLocalStorage(): Promise<string>
    static setEntropyInLocalStorage(entropy: string): void
  }
}