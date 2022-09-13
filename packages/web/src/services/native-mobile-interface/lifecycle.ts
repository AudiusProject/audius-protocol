import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class RequestNetworkConnected extends NativeMobileMessage {
  constructor() {
    super(MessageType.REQUEST_NETWORK_CONNECTED, {})
  }
}
