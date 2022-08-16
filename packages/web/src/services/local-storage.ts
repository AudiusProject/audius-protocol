import { LocalStorage } from 'common/services/local-storage'

export const localStorage = new LocalStorage({
  localStorage: window.localStorage
})
