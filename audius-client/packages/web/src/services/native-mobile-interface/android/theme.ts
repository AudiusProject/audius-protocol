import { NativeMobileMessage } from '../helpers'
import { MessageType } from '../types'

export class PrefersColorSchemeMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.PREFERS_COLOR_SCHEME, {})
  }
}
