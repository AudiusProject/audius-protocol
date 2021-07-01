import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class GetVersion extends NativeMobileMessage {
  constructor() {
    super(MessageType.GET_VERSION, {})
  }
}
