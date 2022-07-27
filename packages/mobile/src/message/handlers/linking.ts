import { Linking } from 'react-native'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.OPEN_LINK]: ({ message }) => {
    Linking.openURL(message.url)
  }
}
