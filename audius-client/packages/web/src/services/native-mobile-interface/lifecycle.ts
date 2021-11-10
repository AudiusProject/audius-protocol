import { User } from 'common/models/User'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class BackendDidSetup extends NativeMobileMessage {
  constructor() {
    super(MessageType.BACKEND_SETUP, {})
  }
}

export class RequestNetworkConnected extends NativeMobileMessage {
  constructor() {
    super(MessageType.REQUEST_NETWORK_CONNECTED, {})
  }
}

export class OnFirstPage extends NativeMobileMessage {
  constructor() {
    super(MessageType.ON_FIRST_PAGE, {})
  }
}

export class NotOnFirstPage extends NativeMobileMessage {
  constructor() {
    super(MessageType.NOT_ON_FIRST_PAGE, {})
  }
}

export class ChangedPage extends NativeMobileMessage {
  constructor(location: Location) {
    super(MessageType.CHANGED_PAGE, { location })
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

export class SignedOut extends NativeMobileMessage {
  constructor() {
    super(MessageType.SIGNED_OUT, {})
  }
}
