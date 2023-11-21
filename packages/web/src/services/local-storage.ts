import { LocalStorage } from '@audius/common'

export const localStorage = new LocalStorage({
  localStorage: typeof window !== 'undefined' ? window.localStorage : {}
})
