import type { ChatMessage } from '@audius/sdk'
import dayjs from 'dayjs'

import { MESSAGE_GROUP_THRESHOLD_MINUTES } from './constants'

/**
 * Checks to see if the message was sent within the time threshold for grouping it with the next message
 */
export const hasTail = (message: ChatMessage, newMessage?: ChatMessage) => {
  if (!newMessage) return true
  return (
    message.sender_user_id !== newMessage.sender_user_id ||
    dayjs(newMessage.created_at).diff(message.created_at, 'minutes') >=
      MESSAGE_GROUP_THRESHOLD_MINUTES
  )
}
