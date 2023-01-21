import { Knex } from 'knex'
import { logger } from './../logger'
import { MessageNotification } from './../appNotifications/mappers/message'
import { MessageReactionNotification } from './../appNotifications/mappers/messageReaction'
import type { DMNotification, DMReactionNotification } from './../types/appNotifications'
import { getRedisConnection } from './../utils/redis_connection'

const lastIndexedMessageRedisKey = 'latestDMNotificationTimestamp'
const lastIndexedReactionRedisKey = 'latestDMReactionNotificationTimestamp'

function notificationTimestampComparator(n1: MessageNotification | MessageReactionNotification, n2: MessageNotification | MessageReactionNotification): number {
  if (n1.notification.timestamp < n2.notification.timestamp) {
    return -1
  }
  if (n1.notification.timestamp > n2.notification.timestamp) {
    return 1
  }
  return 0
}

export async function sendDMNotifications(dnDB: Knex, identityDB: Knex) {
  // Delay in sending notifications for unread messages (in ms)
  const delay = 300000 // 5 minutes
  const maxCursor = new Date(Date.now() - delay)

  // Get min cursors from redis (timestamp of the last indexed notification)
  let minMessageCursor = maxCursor
  let minReactionCursor = maxCursor
  const redis = await getRedisConnection()
  const cachedMessageTimestamp = await redis.get(lastIndexedMessageRedisKey)
  if (cachedMessageTimestamp) {
    minMessageCursor = new Date(Date.parse(cachedMessageTimestamp))
  }
  const cachedReactionTimestamp = await redis.get(lastIndexedReactionRedisKey)
  if (cachedReactionTimestamp) {
    minReactionCursor = new Date(Date.parse(cachedReactionTimestamp))
  }

  // Query DN for unread messages and reactions between min cursor and Date.now() - delay
  const unreadMessages: DMNotification[] = []
  const unreadReactions: DMReactionNotification[] = []
  // const unreadMessages = await dnDB
  //   .select('chat_message.user_id as sender_user_id', 'chat_member.user_id as receiver_user_id', 'chat_message.ciphertext as message', 'chat_message.created_at as timestamp')
  //   .from('chat_message')
  //   .innerJoin('chat_member', 'chat_message.chat_id', 'chat_member.chat_id')
  //   .where('chat_message.created_at', '>', `max(chat_member.last_active_at, ${minMessageCursor})`)
  //   .andWhere('chat_member.created_at', '<=', maxCursor)
  // const unreadReactions = await dnDB
  //   .select('chat_message_reactions.user_id as sender_user_id', 'chat_message.user_id as receiver_user_id', 'chat_message_reactions.reaction as reaction', 'chat_message.ciphertext as message', 'chat_message_reactions.updated_at as timestamp')
  //   .from('chat_message_reactions')
  //   .innerJoin('chat_message', 'chat_message.message_id', 'chat_message_reactions.message_id')
  //   .innerJoin('chat_member chat', 'chat_member.chat_id', 'chat_message.chat_id')
  //   .innerJoin('chat_member user', 'chat_member.user_id', 'chat_message.user_id')
  //   .where('chat_message_reactions.updated_at', '>', `max(user.last_active_at, ${minReactionCursor})`)
  //   .andWhere('chat_message_reactions.updated_at', '<=', maxCursor)

  const messageNotifications = unreadMessages.map(message => new MessageNotification(dnDB, identityDB, message))
  const reactionNotifications = unreadReactions.map(reaction => new MessageReactionNotification(dnDB, identityDB, reaction))
  const notifications: Array<MessageNotification | MessageReactionNotification> = messageNotifications.concat(reactionNotifications)
  // Sort notifications by timestamp (asc)
  notifications.sort(notificationTimestampComparator)

  // Send push notifications
  for (const notification of notifications) {
    await notification.pushNotification()
  }

  if (messageNotifications.length > 0) {
    messageNotifications.sort(notificationTimestampComparator)
    const lastIndexedMessageTimestamp = messageNotifications[messageNotifications.length - 1].notification.timestamp.toUTCString()
    redis.set(lastIndexedMessageRedisKey, lastIndexedMessageTimestamp)
  } else {
    redis.set(lastIndexedMessageRedisKey, maxCursor.toUTCString())
  }

  if (reactionNotifications.length > 0) {
    reactionNotifications.sort(notificationTimestampComparator)
    const lastIndexedReactionTimestamp = reactionNotifications[reactionNotifications.length - 1].notification.timestamp.toUTCString()
    redis.set(lastIndexedReactionRedisKey, lastIndexedReactionTimestamp)
  } else {
    redis.set(lastIndexedReactionRedisKey, maxCursor.toUTCString())
  }

  if (notifications.length > 0) {
    logger.info('processed new DM notifications')
  }
}
