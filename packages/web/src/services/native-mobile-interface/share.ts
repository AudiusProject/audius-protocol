import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class ShareMessage extends NativeMobileMessage {
  constructor(shareProps: { message: string; url: string }) {
    super(MessageType.SHARE_MESSAGE, shareProps)
  }
}
