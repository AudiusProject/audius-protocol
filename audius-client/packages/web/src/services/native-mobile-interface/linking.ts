import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class OpenLinkMessage extends NativeMobileMessage {
  constructor(url: string) {
    super(MessageType.OPEN_LINK, { url })
  }
}

export class ReloadMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.RELOAD, {})
  }
}
