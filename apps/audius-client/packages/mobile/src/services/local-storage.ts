import { LocalStorage } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const localStorage = new LocalStorage({
  localStorage: AsyncStorage
})
