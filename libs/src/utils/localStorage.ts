/**
 * Local storage interface that supports async storage implementations
 */
export type LocalStorage = {
  getItem?: (key: string) => Promise<string | null> | string | null
  setItem?: (key: string, value: string) => Promise<void> | void
  removeItem?: (key: string) => Promise<void> | void
}

/**
 * Fallback for localStorage that works in node and the browser
 * @returns localStorage
 */
export const getPlatformLocalStorage = () => {
  if (typeof window === 'undefined' || window === null) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LocalStorage = require('node-localstorage').LocalStorage
    return new LocalStorage('./local-storage')
  } else {
    return window.localStorage
  }
}
