import { createUseLocalStorageHook } from '@audius/common/hooks'

const getJSONValue = (key: string) => {
  const val = window.localStorage.getItem(key)
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

export const setJSONValue = (key: string, value: any) => {
  const string = JSON.stringify(value)
  window.localStorage.setValue(key, string)
}

export const useLocalStorage = createUseLocalStorageHook({
  getLocalStorageItem: getJSONValue,
  setLocalStorageItem: setJSONValue
})
