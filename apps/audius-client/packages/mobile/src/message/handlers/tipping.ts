import { updateTipsStorage } from 'app/store/tipping/storageUtils'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.UPDATE_TIPS_STORAGE]: ({ message }) => {
    updateTipsStorage(message.storage)
  }
}
