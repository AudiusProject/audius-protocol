import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class ShowGoogleCastPickerMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.SHOW_GOOGLE_CAST_PICKER, {})
  }
}
