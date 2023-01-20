const { logger } = require('./../src/logger.ts')
const { getDB } = require('./../src/conn.ts')
const { getRedisConnection } = require('./../src/utils/redis_connection.ts')

function notificationTimestampComparator(n1, n2) {
  if (n1.notification.timestamp < n2.notification.timestamp) {
    return -1
  }
  if (n1.notification.timestamp > n2.notification.timestamp) {
    return 1
  }
  return 0
}

module.exports = async () => {
  const lastIndexedMessageRedisKey = 'latestDMNotificationTimestamp'
  const lastIndexedReactionRedisKey = 'latestDMReactionNotificationTimestamp'
  const discoveryDBConnection = process.env.DN_DB_URL
  dnDB = await getDB(discoveryDBConnection)

  // Delay in sending notifications for unread messages (in ms)
  const delay = 300000 // 5 minutes
  const maxCursor = new Date(Date.now() - delay).getUTCDate()

  // Get min cursors from redis (timestamp of the last indexed notification)
  const redis = await getRedisConnection()
  const minMessageCursor = await redis.get(lastIndexedMessageRedisKey) || maxCursor
  const minReactionCursor = await redis.get(lastIndexedReactionRedisKey) || maxCursor

  // Query DN for unread messages and reactions between min cursor and Date.now() - delay
  const unreadMessages = []
  const unreadReactions = []
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

  const identityDBConnection = process.env.IDENTITY_DB_URL
  identityDB = await getDB(identityDBConnection)

  const messageNotifications = unreadMessages.map(message => new MessageNotification(dnDB, identityDB, message))
  const reactionNotifications = unreadReactions.map(reaction => new MessageReactionNotification(dnDB, identityDB, reaction))
  const notifications = messageNotifications.concat(reactionNotifications)
  // Sort notifications by timestamp (asc)
  notifications.sort(notificationTimestampComparator)

  // Send push notifications
  for (notification in notifications) {
    await notification.pushNotification()
  }

  if (messageNotifications.length > 0) {
    messageNotifications.sort(notificationTimestampComparator)
    lastIndexedMessageTimestamp = messageNotifications[messageNotifications.length - 1].notification.timestamp
    redis.set(lastIndexedMessageRedisKey, lastIndexedMessageTimestamp)
  } else {
    redis.set(lastIndexedMessageRedisKey, maxCursor)
  }

  if (reactionNotifications.length > 0) {
    reactionNotifications.sort(notificationTimestampComparator)
    lastIndexedReactionTimestamp = reactionNotifications[reactionNotifications.length - 1].notification.timestamp
    redis.set(lastIndexedReactionRedisKey, lastIndexedReactionTimestamp)
  } else {
    redis.set(lastIndexedReactionRedisKey, maxCursor)
  }

  if (notifications.length > 0) {
    logger.info('processed new DM notifications')
  }
}
