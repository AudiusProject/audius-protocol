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

export class PromptPushNotificationPermissions extends NativeMobileMessage {
  constructor() {
    super(MessageType.PROMPT_PUSH_NOTIFICATION_REMINDER)
  }
}
