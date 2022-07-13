import { CommonStoreContext } from 'common/store'

export const webStoreContext: CommonStoreContext = {
  getLocalStorageItem: async (key) => window.localStorage.getItem(key),
  setLocalStorageItem: async (key, value) =>
    window.localStorage.setItem(key, value)
}
