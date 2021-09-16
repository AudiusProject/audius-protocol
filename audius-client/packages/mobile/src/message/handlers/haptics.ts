import * as haptics from '../../haptics'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.HAPTIC_FEEDBACK]: () => {
    haptics.light()
  }
}
