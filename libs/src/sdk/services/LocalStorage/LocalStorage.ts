import type { LocalStorageType, LocalStorageConfig } from './types'

export class LocalStorage {
  localStorage: LocalStorageType

  constructor(config: LocalStorageConfig) {
    this.localStorage = config.localStorage
  }

  getItem = async (key: string) => {
    return await this.localStorage.getItem(key)
  }

  async getJSONItem<T>(key: string): Promise<T | null> {
    const val = await this.getItem(key)
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

  setItem = async (key: string, value: string) => {
    return await this.localStorage.setItem(key, value)
  }

  async setJSONItem(key: string, value: any) {
    const string = JSON.stringify(value)
    await this.setItem(key, string)
  }

  async removeItem(key: string) {
    await this.localStorage.removeItem(key)
  }
}
