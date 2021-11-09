import { NativeModules } from 'react-native'

import { showCastPicker } from 'app/store/googleCast/controller'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.GOOGLE_CAST]: () => {
    showCastPicker()
  },
  [MessageType.AIRPLAY]: () => {
    const airplay = NativeModules.AirplayViewManager
    airplay.click()
  }
}
