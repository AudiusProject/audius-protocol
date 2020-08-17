import { NativeMobileMessage } from '../helpers'
import { MessageType } from '../types'

export class EnablePullToRefreshMessage extends NativeMobileMessage {
  constructor(reuseMessageId = false) {
    // Whether or not to reuse the stored message id in the react native
    // layer.
    super(MessageType.ENABLE_PULL_TO_REFRESH, { reuseMessageId })
  }
}

export class DisablePullToRefreshMessage extends NativeMobileMessage {
  /**
   * @param enablingMessageId the message id for the original message used to enable pull to
   * refresh
   */
  constructor(enablingMessageId: string | null = null) {
    super(MessageType.DISABLE_PULL_TO_REFRESH, { enablingMessageId })
  }
}
