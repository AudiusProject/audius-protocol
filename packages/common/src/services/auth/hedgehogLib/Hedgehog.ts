import { WalletManager } from './WalletManager'
import type {
  ChangeCredentialsArgs,
  CreateKey,
  EthWallet,
  GetFn,
  LocalStorage,
  LoginArgs,
  SetAuthFn,
  SetUserFn
} from './types'
import {
  getPlatformCreateKey,
  getPlatformLocalStorage,
  waitUntil
} from './utils'

/**
 * Port of the @audius/hedgehog 3.0.0-alpha.1 Hedgehog class.
 */
export class Hedgehog {
  getFn: GetFn
  setAuthFn: SetAuthFn
  setUserFn: SetUserFn
  wallet: null | EthWallet
  localStorage: LocalStorage
  createKey: CreateKey
  ready: boolean

  constructor(
    getFn?: GetFn,
    setAuthFn?: SetAuthFn,
    setUserFn?: SetUserFn,
    useLocalStorage = true,
    localStorage: LocalStorage = getPlatformLocalStorage(),
    createKey: CreateKey = getPlatformCreateKey()
  ) {
    if (!getFn || !setAuthFn || !setUserFn) {
      throw new Error(
        'Please pass in valid getFn, setAuthFn and setUserFn parameters into the Hedgehog constructor'
      )
    }
    this.getFn = getFn
    this.setAuthFn = setAuthFn
    this.setUserFn = setUserFn
    this.wallet = null
    this.localStorage = localStorage
    this.createKey = createKey
    this.ready = false

    // If there's entropy in localStorage, recover that and create a wallet object and put it
    // on the wallet property in the class
    if (useLocalStorage) {
      this.restoreLocalWallet().then(() => {
        this.ready = true
      })
    } else {
      this.ready = true
    }
  }

  /**
   * Only needed if `useLocalStorage = true`
   */
  isReady() {
    return this.ready
  }

  /**
   * Only needed if `useLocalStorage = true`
   */
  async waitUntilReady() {
    await waitUntil(() => this.isReady())
  }

  /**
   * Given user credentials, create a client side wallet and all other authentication artifacts,
   * call setFn to persist the artifacts to a server and return the wallet object
   */
  async signUp({ username, password, ...optionalParams }: LoginArgs) {
    const createWalletPromise = WalletManager.createWalletObj(
      password,
      null,
      this.localStorage,
      this.createKey
    )
    const lookupKeyPromise = WalletManager.createAuthLookupKey(
      username,
      password,
      this.createKey
    )

    try {
      const [walletResult, lookupKey] = await Promise.all([
        createWalletPromise,
        lookupKeyPromise
      ])

      if (walletResult instanceof Error) throw walletResult
      const { ivHex, cipherTextHex, walletObj } = walletResult

      const walletAddress = walletObj.getAddressString()

      const authData = {
        ...optionalParams,
        iv: ivHex,
        cipherText: cipherTextHex,
        wallet: walletObj,
        lookupKey
      }

      const userData = {
        ...optionalParams,
        username,
        walletAddress
      }
      await this.setUserFn(userData)
      await this.setAuthFn(authData)

      // set the wallet at the very end to make sure the isLoggedIn() function doesn't return true
      this.wallet = walletObj

      return walletObj
    } catch (e) {
      await this.logout()
      throw e
    }
  }

  /**
   * Generate new set of auth credentials to allow login
   * If the old password is included, the setAuthFn will include the old lookup key for deletion
   */
  async resetPassword({ username, password, ...optionalParams }: LoginArgs) {
    const entropy = await WalletManager.getEntropyFromLocalStorage(
      this.localStorage
    )
    if (entropy === null) {
      throw new Error('resetPassword - missing entropy')
    }

    const createWalletPromise = WalletManager.createWalletObj(
      password,
      entropy,
      this.localStorage,
      this.createKey
    )
    const lookupKeyPromise = WalletManager.createAuthLookupKey(
      username,
      password,
      this.createKey
    )

    try {
      const [walletResult, lookupKey] = await Promise.all([
        createWalletPromise,
        lookupKeyPromise
      ])

      if (walletResult instanceof Error) throw walletResult
      const { ivHex, cipherTextHex, walletObj } = walletResult

      const authData = {
        ...optionalParams,
        iv: ivHex,
        cipherText: cipherTextHex,
        wallet: walletObj,
        lookupKey
      }

      await this.setAuthFn(authData)
      this.wallet = walletObj
    } catch (e) {
      await this.logout()
      throw e
    }
  }

  /**
   * Generate new set of auth credentials to allow login and remove the old credentials
   * Note: Doesn't log out on error
   */
  async changeCredentials({
    newUsername,
    newPassword,
    oldUsername,
    oldPassword,
    ...optionalParams
  }: ChangeCredentialsArgs) {
    const entropy = await WalletManager.getEntropyFromLocalStorage(
      this.localStorage
    )
    if (entropy === null) {
      throw new Error('changePassword - missing entropy')
    }

    const createWalletPromise = WalletManager.createWalletObj(
      newPassword,
      entropy,
      this.localStorage,
      this.createKey
    )
    const lookupKeyPromise = WalletManager.createAuthLookupKey(
      newUsername,
      newPassword,
      this.createKey
    )
    const oldLookupKeyPromise = WalletManager.createAuthLookupKey(
      oldUsername !== undefined ? oldUsername : newUsername,
      oldPassword,
      this.createKey
    )
    const [walletResult, lookupKey, oldLookupKey] = await Promise.all([
      createWalletPromise,
      lookupKeyPromise,
      oldLookupKeyPromise
    ])

    if (walletResult instanceof Error) throw walletResult

    const { ivHex, cipherTextHex, walletObj } = walletResult

    const authData = {
      ...optionalParams,
      iv: ivHex,
      cipherText: cipherTextHex,
      lookupKey,
      wallet: walletObj,
      oldLookupKey
    }

    await this.setAuthFn(authData)
    this.wallet = walletObj
  }

  /**
   * Given user credentials, attempt to get authentication artifacts from server using
   * getFn, create the private key using the artifacts and the user password
   */
  async login({ username, password, ...optionalParams }: LoginArgs) {
    const lookupKey = await WalletManager.createAuthLookupKey(
      username,
      password,
      this.createKey
    )
    const data = await this.getFn({ ...optionalParams, lookupKey })

    if (data && data.iv && data.cipherText) {
      const { walletObj, entropy } =
        await WalletManager.decryptCipherTextAndRetrieveWallet(
          password,
          data.iv,
          data.cipherText,
          this.createKey
        )

      this.wallet = walletObj

      await WalletManager.setEntropyInLocalStorage(entropy, this.localStorage)
      return walletObj
    } else {
      throw new Error('No account record for user')
    }
  }

  /**
   * Confirms the user credentials given generate the same entropy after using artifacts from the server
   * @returns whether or not the credentials are valid for the current user
   */
  async confirmCredentials({
    username,
    password,
    ...optionalParams
  }: LoginArgs) {
    const existingEntropy = await WalletManager.getEntropyFromLocalStorage(
      this.localStorage
    )
    if (!existingEntropy) return false // not logged in yet

    const lookupKey = await WalletManager.createAuthLookupKey(
      username,
      password,
      this.createKey
    )
    const data = await this.getFn({ ...optionalParams, lookupKey })

    if (data && data.iv && data.cipherText) {
      const { walletObj, entropy } =
        await WalletManager.decryptCipherTextAndRetrieveWallet(
          password,
          data.iv,
          data.cipherText,
          this.createKey
        )

      // test against current entropy in localStorage and current wallet
      return (
        entropy === existingEntropy &&
        this.wallet !== null &&
        this.wallet.getAddressString() === walletObj.getAddressString()
      )
    }
    return false
  }

  /**
   * Deletes the local client side wallet including entropy
   */
  async logout() {
    this.wallet = null
    await WalletManager.deleteEntropyFromLocalStorage(this.localStorage)
  }

  isLoggedIn() {
    return !!this.wallet
  }

  getWallet() {
    return this.wallet
  }

  /**
   * Restore the client side wallet from localStorage, if it exists
   */
  async restoreLocalWallet() {
    const walletObj = await WalletManager.getWalletObjFromLocalStorageIfExists(
      this.localStorage
    )
    if (walletObj) {
      this.wallet = walletObj
      return walletObj
    } else return null
  }

  /**
   * Create a new client side wallet object without going through the signup flow.
   */
  async createWalletObj(password: string) {
    if (password) {
      const walletResult = await WalletManager.createWalletObj(
        password,
        null,
        this.localStorage,
        this.createKey
      )
      if (walletResult instanceof Error) throw walletResult
      const { walletObj, entropy } = walletResult
      this.wallet = walletObj

      await WalletManager.setEntropyInLocalStorage(entropy, this.localStorage)

      return walletObj
    } else {
      throw new Error('Please pass in a valid password')
    }
  }
}
