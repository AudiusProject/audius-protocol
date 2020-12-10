import { MessageType } from './types'
import { NativeMobileMessage } from './helpers'

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
