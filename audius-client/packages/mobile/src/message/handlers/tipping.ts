import { updateTipsStorage } from 'audius-client/src/common/store/tipping/storageUtils'

import { localStorage } from 'app/services/local-storage'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.UPDATE_TIPS_STORAGE]: ({ message }) => {
    updateTipsStorage(message.storage, localStorage)
  }
}
