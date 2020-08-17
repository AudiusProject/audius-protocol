import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class HapticFeedbackMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.HAPTIC_FEEDBACK, {})
  }
}
