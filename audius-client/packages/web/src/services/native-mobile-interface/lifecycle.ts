import { User } from '@audius/common'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class RequestNetworkConnected extends NativeMobileMessage {
  constructor() {
    super(MessageType.REQUEST_NETWORK_CONNECTED, {})
  }
}

export class SignedIn extends NativeMobileMessage {
  constructor(account: User) {
    super(MessageType.SIGNED_IN, { account })
  }
}

export class FetchAccountFailed extends NativeMobileMessage {
  constructor() {
    super(MessageType.FETCH_ACCOUNT_FAILED)
  }
}
