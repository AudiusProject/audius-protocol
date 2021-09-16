import { Linking } from 'react-native'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.OPEN_LINK]: ({ message }) => {
    Linking.openURL(message.url)
  }
}
