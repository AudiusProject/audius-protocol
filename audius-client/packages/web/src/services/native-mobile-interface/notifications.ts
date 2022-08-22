import { Notification } from '@audius/common'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class EnablePushNotificationsMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.ENABLE_PUSH_NOTIFICATIONS)
  }
}

export class DisablePushNotificationsMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.DISABLE_PUSH_NOTIFICATIONS)
  }
}

export class ResetNotificationsBadgeCount extends NativeMobileMessage {
  constructor() {
    super(MessageType.RESET_NOTIFICATIONS_BADGE_COUNT)
  }
}

export class PromptPushNotificationPermissions extends NativeMobileMessage {
  constructor() {
    super(MessageType.PROMPT_PUSH_NOTIFICATION_REMINDER)
  }
}

export class OpenNotificationsMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.OPEN_NOTIFICATIONS)
  }
}

export class FetchNotificationsSuccessMessage extends NativeMobileMessage {
  constructor(notifications: Notification[]) {
    super(MessageType.FETCH_NOTIFICATIONS_SUCCESS, { notifications })
  }
}

export class FetchNotificationsReplaceMessage extends NativeMobileMessage {
  constructor(notifications: Notification[]) {
    super(MessageType.FETCH_NOTIFICATIONS_REPLACE, { notifications })
  }
}

export class FetchNotificationsFailureMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.FETCH_NOTIFICATIONS_FAILURE)
  }
}
