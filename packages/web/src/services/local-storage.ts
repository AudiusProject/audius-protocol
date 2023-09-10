import { LocalStorage } from '@audius/common'

export const localStorage = new LocalStorage({
  localStorage: window.localStorage
})
