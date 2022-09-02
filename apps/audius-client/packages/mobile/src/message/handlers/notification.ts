import { remindUserToTurnOnNotifications } from 'app/components/notification-reminder/NotificationReminder'
import type { MessageHandlers } from 'app/message/types'
import { MessageType } from 'app/message/types'
import PushNotifications from 'app/notifications'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.ENABLE_PUSH_NOTIFICATIONS]: async ({ message, postMessage }) => {
    PushNotifications.requestPermission()
    const info = await PushNotifications.getToken()
    postMessage({
      type: message.type,
      id: message.id,
      ...info
    })
  },
  [MessageType.DISABLE_PUSH_NOTIFICATIONS]: async ({
    message,
    postMessage
  }) => {
    const info = await PushNotifications.getToken()
    PushNotifications.deregister()
    postMessage({
      type: message.type,
      id: message.id,
      ...info
    })
  },
  [MessageType.PROMPT_PUSH_NOTIFICATION_REMINDER]: ({ dispatch }) => {
    remindUserToTurnOnNotifications(dispatch)
  }
}
