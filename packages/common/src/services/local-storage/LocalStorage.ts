import { CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY } from '@audius/sdk/dist/core'

import { User } from 'models/User'
import { PLAYBACK_RATE_LS_KEY } from 'store/index'

import { Nullable } from '../../utils'

// TODO: the following should come from @audius/libs/dist/core when
// discoveryProvider/constants is migrated to typescript.
const AUDIUS_ACCOUNT_KEY = '@audius/account'
const AUDIUS_ACCOUNT_USER_KEY = '@audius/audius-user'

type LocalStorageType = {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}

type LocalStorageConfig = {
  localStorage: LocalStorageType
}

export type CachedDiscoveryProviderType = {
  endpoint: string
  timestamp: string
}

export class LocalStorage {
  localStorage: LocalStorageType

  constructor(config: LocalStorageConfig) {
    this.localStorage = config.localStorage
  }

  getItem = async (key: string) => {
    return await this.localStorage.getItem(key)
  }

  getValue = async (key: string) => {
    return await this.localStorage.getItem(key)
  }

  async getJSONValue<T>(key: string): Promise<T | null> {
    const val = await this.getValue(key)
    if (val) {
      try {
        const parsed = JSON.parse(val)
        return parsed
      } catch (e) {
        return null
      }
    }
    return null
  }

  async getExpiringJSONValue<T>(key: string): Promise<T | null> {
    const res: Nullable<{ value: T; expiry: number }> = await this.getJSONValue(
      key
    )
    if (!res) {
      return null
    }

    const isExpired = res.expiry < Date.now()
    if (isExpired) {
      this.localStorage.removeItem(key)
      return null
    }

    return res.value
  }

  setItem = async (key: string, value: string) => {
    return await this.localStorage.setItem(key, value)
  }

  setValue = async (key: string, value: string) => {
    return await this.localStorage.setItem(key, value)
  }

  async setJSONValue(key: string, value: any) {
    const string = JSON.stringify(value)
    await this.setValue(key, string)
  }

  setExpiringJSONValue<T>(key: string, value: T, ttlSeconds: number) {
    const expiring = {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    }
    this.localStorage.setItem(key, JSON.stringify(expiring))
  }

  async removeItem(key: string) {
    await this.localStorage.removeItem(key)
  }

  getAudiusAccount = async () => this.getJSONValue(AUDIUS_ACCOUNT_KEY)
  setAudiusAccount = async (value: object) => {
    await this.setJSONValue(AUDIUS_ACCOUNT_KEY, value)
  }

  clearAudiusAccount = async () => this.removeItem(AUDIUS_ACCOUNT_KEY)

  getAudiusAccountUser = async (): Promise<User | null> =>
    this.getJSONValue(AUDIUS_ACCOUNT_USER_KEY)

  setAudiusAccountUser = async (value: User) =>
    this.setJSONValue(AUDIUS_ACCOUNT_USER_KEY, value)

  clearAudiusAccountUser = async () => this.removeItem(AUDIUS_ACCOUNT_USER_KEY)

  clearPlaybackRate = async () => this.removeItem(PLAYBACK_RATE_LS_KEY)

  getCurrentUserExists = async () =>
    this.getValue(CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY)
}
