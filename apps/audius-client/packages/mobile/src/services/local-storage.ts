import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocalStorage } from 'common/services/local-storage'

export const localStorage = new LocalStorage({
  localStorage: AsyncStorage
})
