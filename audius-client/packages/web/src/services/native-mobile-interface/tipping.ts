import { RecentTipsStorage } from '@audius/common'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class UpdateTipsStorageMessage extends NativeMobileMessage {
  constructor(storage: RecentTipsStorage) {
    super(MessageType.UPDATE_TIPS_STORAGE, { storage })
  }
}
