import VersionNumber from 'react-native-version-number'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.GET_VERSION]: ({ message, postMessage }) => {
    const version = VersionNumber.appVersion
    postMessage({
      type: message.type,
      id: message.id,
      version
    })
  }
}
