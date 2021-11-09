import { handleWebAppLog } from 'app/utils/logging'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.LOGGING]: ({ message }) => {
    handleWebAppLog(message.level, message.message)
  }
}
