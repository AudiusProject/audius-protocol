import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class RequestTwitterAuthMessage extends NativeMobileMessage {
  constructor(authURL: string) {
    super(MessageType.REQUEST_TWITTER_AUTH, { authURL })
  }
}

export class RequestInstagramAuthMessage extends NativeMobileMessage {
  constructor(authURL: string) {
    super(MessageType.REQUEST_INSTAGRAM_AUTH, { authURL })
  }
}
