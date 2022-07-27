import * as haptics from 'app/haptics'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.HAPTIC_FEEDBACK]: () => {
    haptics.light()
  }
}
