import { handleWebAppLog } from '../../utils/logging'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.LOGGING]: ({ message }) => {
    handleWebAppLog(message.level, message.message)
  }
}
