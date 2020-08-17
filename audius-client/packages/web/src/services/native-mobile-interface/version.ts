import { MessageType } from './types'
import { NativeMobileMessage } from './helpers'

export class GetVersion extends NativeMobileMessage {
  constructor() {
    super(MessageType.GET_VERSION, {})
  }
}
