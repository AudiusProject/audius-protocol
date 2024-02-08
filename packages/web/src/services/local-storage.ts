import { LocalStorage } from '@audius/common/services'

export const localStorage = new LocalStorage({
  localStorage:
    typeof window !== 'undefined'
      ? window.localStorage
      : {
          getItem: (key) => null,
          setItem: (key: string, value: string) => {},
          removeItem: (key: string) => {}
        }
})
