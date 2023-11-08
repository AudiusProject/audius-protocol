import type { ChatMessage } from '@audius/sdk'

import { Status } from 'models/Status'

import { MESSAGE_GROUP_THRESHOLD_MINUTES } from './constants'
import dayjs from './dayjs'

export const CHAT_BLOG_POST_URL =
  'http://support.audius.co/help/How-to-Send-Messages-on-Audius'

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

/**
 * Checks if the current message:
 * - Is the first unread message
 * - Is by a different user than the current one
 * - Is not the very first message
 */
export const isEarliestUnread = ({
  unreadCount,
  lastReadAt,
  currentMessageIndex,
  messages,
  currentUserId
}: {
  unreadCount: number
  lastReadAt?: string
  currentMessageIndex: number
  messages: ChatMessage[]
  currentUserId: string | null
}) => {
  if (unreadCount === 0) {
    return false
  }
  const message = messages[currentMessageIndex]
  const prevMessage = messages[currentMessageIndex + 1]
  const isUnread = !lastReadAt || dayjs(message.created_at).isAfter(lastReadAt)
  const isPreviousMessageUnread =
    prevMessage &&
    (!lastReadAt || dayjs(prevMessage.created_at).isAfter(lastReadAt))
  const isAuthor = message.sender_user_id === currentUserId
  return isUnread && !!prevMessage && !isPreviousMessageUnread && !isAuthor
}

/**
 * Can only fetch more messages if it's not in a loading state and
 * there are previous messages to fetch
 */
export const chatCanFetchMoreMessages = (
  messagesStatus?: Status,
  prevCount?: number
) => {
  return !!messagesStatus && messagesStatus !== Status.LOADING && !!prevCount
}
