import { handleWebAppLog } from 'app/utils/logging'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.LOGGING]: ({ message }) => {
    handleWebAppLog(message.level, message.message)
  }
}
