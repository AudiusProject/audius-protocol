import { RecentTipsStorage } from 'common/models/Tipping'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class UpdateTipsStorageMessage extends NativeMobileMessage {
  constructor(storage: RecentTipsStorage) {
    super(MessageType.UPDATE_TIPS_STORAGE, { storage })
  }
}
