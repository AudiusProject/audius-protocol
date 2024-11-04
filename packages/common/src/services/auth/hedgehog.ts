import { Hedgehog, WalletManager, getPlatformCreateKey } from '@audius/hedgehog'
import type { SetAuthFn, SetUserFn, GetFn, CreateKey } from '@audius/hedgehog'

import type { LocalStorage } from '../local-storage'

import type { IdentityService } from './identity'

export type HedgehogConfig = {
  identityService: IdentityService
  useLocalStorage?: boolean
  localStorage?: LocalStorage
  createKey?: CreateKey
}

export type HedgehogInstance = Hedgehog & {
  generateRecoveryInfo: () => Promise<{ login: string; host: string }>
  getLookupKey: ({
    username,
    password
  }: {
    username: string
    password: string
  }) => Promise<string>
  refreshWallet: () => Promise<void>
}

export const createHedgehog = ({
  identityService,
  useLocalStorage = true,
  localStorage,
  createKey = getPlatformCreateKey()
}: HedgehogConfig): HedgehogInstance => {
  const getFn: IdentityService['getFn'] = async (obj) => {
    return await identityService.getFn(obj)
  }

  const setAuthFn: SetAuthFn = async (obj) => {
    return await identityService.setAuthFn(obj)
  }

  const setUserFn: SetUserFn = async (obj) => {
    return await identityService.setUserFn(obj)
  }

  const hedgehog = new Hedgehog(
    getFn as GetFn,
    setAuthFn,
    setUserFn,
    useLocalStorage,
    localStorage,
    createKey
  )

  /**
   * Generate secure credentials to allow login
   */
  // @ts-expect-error -- adding our own custom method to hedgehog
  hedgehog.generateRecoveryInfo = async () => {
    const entropy = await WalletManager.getEntropyFromLocalStorage(
      hedgehog.localStorage
    )
    if (entropy === null) {
      throw new Error('generateRecoveryLink - missing entropy')
    }
    let btoa // binary to base64 ASCII conversion
    let currentHost
    if (typeof window !== 'undefined' && window && window.btoa) {
      btoa = window.btoa
      currentHost = window.location.origin
    } else {
      btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
      currentHost = 'localhost'
    }
    const recoveryInfo = { login: btoa(entropy), host: currentHost }
    return recoveryInfo
  }

  // @ts-expect-error -- adding our own custom method to hedgehog
  hedgehog.getLookupKey = async ({
    username,
    password
  }: {
    username: string
    password: string
  }) => {
    return await WalletManager.createAuthLookupKey(
      username,
      password,
      hedgehog.createKey
    )
  }

  // @ts-expect-error -- adding our own custom method to hedgehog
  hedgehog.refreshWallet = async () => {
    // Important, set ready to false to block any new requests while we async update
    // the wallet from entropy
    hedgehog.ready = false
    hedgehog.restoreLocalWallet().finally(() => {
      hedgehog.ready = true
    })
  }

  // Wrap the original login method to handle ready state
  const originalLogin = hedgehog.login.bind(hedgehog)
  hedgehog.login = async (...params: Parameters<typeof originalLogin>) => {
    hedgehog.ready = false
    try {
      const wallet = await originalLogin(...params)
      return wallet
    } finally {
      hedgehog.ready = true
    }
  }

  return hedgehog as HedgehogInstance
}
