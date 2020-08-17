import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class AirplayMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.AIRPLAY, {})
  }
}
