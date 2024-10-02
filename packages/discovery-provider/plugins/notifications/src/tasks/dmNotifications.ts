import { Knex } from 'knex'
import type { RedisClientType } from 'redis'
import { config } from './../config'
import { logger } from './../logger'
import { Message } from './../processNotifications/mappers/message'
import { MessageReaction } from './../processNotifications/mappers/messageReaction'
import type {
  DMNotification,
  DMReactionNotification
} from './../types/notifications'
import { getRedisConnection } from './../utils/redisConnection'
import { Timer } from '../utils/timer'
import { makeChatId } from '../utils/chatId'

// Sort notifications in ascending order according to timestamp
function notificationTimestampComparator(
  n1: Message | MessageReaction,
  n2: Message | MessageReaction
): number {
  if (n1.notification.timestamp < n2.notification.timestamp) {
    return -1
  }
  if (n1.notification.timestamp > n2.notification.timestamp) {
    return 1
  }
  return 0
}

async function getCursors(redis: RedisClientType): Promise<{
  maxTimestamp: Date
  minMessageTimestamp: Date
  minReactionTimestamp: Date
}> {
  const maxCursor = new Date(Date.now() - config.dmNotificationDelay)

  // Get min cursors from redis (timestamps of the last indexed notifications)
  let minMessageCursor = maxCursor
  let minReactionCursor = maxCursor
  const cachedMessageTimestamp = await redis.get(
    config.lastIndexedMessageRedisKey
  )
  if (cachedMessageTimestamp) {
    minMessageCursor = new Date(Date.parse(cachedMessageTimestamp))
  }
  const cachedReactionTimestamp = await redis.get(
    config.lastIndexedReactionRedisKey
  )
  if (cachedReactionTimestamp) {
    minReactionCursor = new Date(Date.parse(cachedReactionTimestamp))
  }

  return {
    maxTimestamp: maxCursor,
    minMessageTimestamp: minMessageCursor,
    minReactionTimestamp: minReactionCursor
  }
}

async function getUnreadMessages(
  discoveryDB: Knex,
  minTimestamp: Date,
  maxTimestamp: Date
): Promise<DMNotification[]> {
  return await discoveryDB
    .select(
      'chat_member.chat_id as chat_id',
      'chat_message.user_id as sender_user_id',
      'chat_member.user_id as receiver_user_id',
      'chat_message.created_at as timestamp'
    )
    .from('chat_message')
    .innerJoin('chat_member', 'chat_message.chat_id', 'chat_member.chat_id')
    // Javascript dates are limited to 3 decimal places (milliseconds). Truncate the postgresql timestamp to match.
    .whereRaw(
      `date_trunc('milliseconds', chat_message.created_at) > greatest(chat_member.last_active_at, ?::timestamp)`,
      [minTimestamp.toISOString()]
    )
    .andWhereRaw(`date_trunc('milliseconds', chat_message.created_at) <= ?`, [
      maxTimestamp.toISOString()
    ])
    .andWhereRaw('chat_message.user_id != chat_member.user_id')
}

async function getUnreadReactions(
  discoveryDB: Knex,
  minTimestamp: Date,
  maxTimestamp: Date
): Promise<DMReactionNotification[]> {
  return await discoveryDB
    .select(
      'chat_member.chat_id as chat_id',
      'chat_message.message_id',
      'chat_message_reactions.user_id as sender_user_id',
      'chat_message.user_id as receiver_user_id',
      'chat_message_reactions.reaction as reaction',
      'chat_message_reactions.updated_at as timestamp'
    )
    .from('chat_message_reactions')
    .innerJoin(
      'chat_message',
      'chat_message.message_id',
      'chat_message_reactions.message_id'
    )
    .joinRaw(
      'join chat_member on chat_member.chat_id = chat_message.chat_id and chat_member.user_id = chat_message.user_id'
    )
    // Javascript dates are limited to 3 decimal places (milliseconds). Truncate the postgresql timestamp to match.
    .whereRaw(
      `date_trunc('milliseconds', chat_message_reactions.updated_at) > greatest(chat_member.last_active_at, ?)`,
      [minTimestamp.toISOString()]
    )
    .andWhereRaw(
      `date_trunc('milliseconds', chat_message_reactions.updated_at) <= ? `,
      [maxTimestamp.toISOString()]
    )
    .andWhereRaw('chat_message_reactions.user_id != chat_member.user_id')
}

async function getNewBlasts(
  discoveryDB: Knex,
  minTimestamp: Date,
  maxTimestamp: Date
): Promise<DMNotification[]> {
  const messages = await discoveryDB.raw(
    `
    WITH blast AS (
      SELECT * FROM chat_blast
    ),
    aud AS (
      -- follower_audience
      SELECT blast_id, follower_user_id AS to_user_id
      FROM follows
      JOIN blast
        ON blast.audience = 'follower_audience'
        AND follows.followee_user_id = blast.from_user_id
        AND follows.is_delete = false
        AND follows.created_at < blast.created_at

      UNION

      -- tipper_audience
      SELECT blast_id, sender_user_id AS to_user_id
      FROM user_tips tip
      JOIN blast
        ON blast.audience = 'tipper_audience'
        AND receiver_user_id = blast.from_user_id
        AND tip.created_at < blast.created_at

      UNION

      -- remixer_audience
      SELECT blast_id, t.owner_id AS to_user_id
      FROM tracks t
      JOIN remixes ON remixes.child_track_id = t.track_id
      JOIN tracks og ON remixes.parent_track_id = og.track_id
      JOIN blast
        ON blast.audience = 'remixer_audience'
        AND og.owner_id = blast.from_user_id
        AND (
          blast.audience_content_id IS NULL
          OR (
            blast.audience_content_type = 'track'
            AND blast.audience_content_id = og.track_id
          )
        )

      UNION

      -- customer_audience
      SELECT blast_id, buyer_user_id AS to_user_id
      FROM usdc_purchases p
      JOIN blast
        ON blast.audience = 'customer_audience'
        AND p.seller_user_id = blast.from_user_id
        AND (
          blast.audience_content_id IS NULL
          OR (
            blast.audience_content_type = p.content_type::text
            AND blast.audience_content_id = p.content_id
          )
        )
    ),
    targ AS (
      SELECT
        blast_id,
        from_user_id,
        to_user_id,
        blast.created_at
      FROM blast
      JOIN aud USING (blast_id)
      LEFT JOIN chat_member member_a on from_user_id = member_a.user_id
      LEFT JOIN chat_member member_b on to_user_id = member_b.user_id and member_b.chat_id = member_a.chat_id
      WHERE member_b.chat_id IS NULL -- !! note this is the opposite from the query in chat_blast.go
      AND date_trunc('milliseconds', blast.created_at) > ?
      AND date_trunc('milliseconds', blast.created_at) <= ?
    )
    SELECT from_user_id AS sender_user_id, to_user_id AS receiver_user_id, created_at FROM targ WHERE chat_allowed(from_user_id, to_user_id);
    `,
    [minTimestamp.toISOString(), maxTimestamp.toISOString()]
  )

  const formattedMessages = messages.rows.map((message) => {
    return {
      ...message,
      chatId: makeChatId([message.sender_user_id, message.receiver_user_id])
    }
  })

  return formattedMessages
}

function setLastIndexedTimestamp(
  redis: RedisClientType,
  redisKey: string,
  maxTimestamp: Date,
  notifications: Message[] | MessageReaction[]
) {
  if (notifications.length > 0) {
    notifications.sort(notificationTimestampComparator)
    const lastIndexedTimestamp =
      notifications[
        notifications.length - 1
      ].notification.timestamp.toISOString()
    redis.set(redisKey, lastIndexedTimestamp)
  } else {
    redis.set(redisKey, maxTimestamp.toISOString())
  }
}

enum DMPhase {
  START = 'START',
  GET_UNREAD_MESSAGES = 'GET_UNREAD_MESSAGES',
  GET_UNREAD_REACTIONS = 'GET_UNREAD_REACTIONS',
  GET_NEW_BLASTS = 'GET_NEW_BLASTS',
  PUSH_NOTIFICATIONS = 'PUSH_NOTIFICATIONS',
  FINSH = 'FINSH'
}

export async function sendDMNotifications(
  discoveryDB: Knex,
  identityDB: Knex,
  isBrowserPushEnabled?: boolean
) {
  const timer = new Timer('dm')
  try {
    // Query DN for unread messages and reactions between min and max cursors
    const redis = await getRedisConnection()
    const cursors = await getCursors(redis)

    timer.logMessage(DMPhase.GET_UNREAD_MESSAGES)
    const unreadMessages = await getUnreadMessages(
      discoveryDB,
      cursors.minMessageTimestamp,
      cursors.maxTimestamp
    )
    if (unreadMessages.length > 0) {
      console.log(
        `dmNotifications: unread message notifications: ${JSON.stringify(
          unreadMessages
        )}`
      )
    }

    timer.logMessage(DMPhase.GET_UNREAD_REACTIONS)

    const unreadReactions = await getUnreadReactions(
      discoveryDB,
      cursors.minReactionTimestamp,
      cursors.maxTimestamp
    )
    if (unreadReactions.length > 0) {
      console.log(
        `dmNotifications: unread message reaction notifications: ${JSON.stringify(
          unreadReactions
        )}`
      )
    }

    timer.logMessage(DMPhase.GET_NEW_BLASTS)
    const newBlasts = await getNewBlasts(
      discoveryDB,
      cursors.minMessageTimestamp,
      cursors.maxTimestamp
    )
    if (newBlasts.length > 0) {
      console.log(
        `dmNotifications: new chat blast notifications: ${JSON.stringify(
          newBlasts
        )}`
      )
    }

    // Convert to notifications
    const messageNotifications = unreadMessages.map(
      (message) => new Message(discoveryDB, identityDB, message)
    )
    const reactionNotifications = unreadReactions.map(
      (reaction) => new MessageReaction(discoveryDB, identityDB, reaction)
    )
    const blastNotifications = newBlasts.map(
      (blast) => new Message(discoveryDB, identityDB, blast)
    )
    const notifications: Array<Message | MessageReaction> = messageNotifications
      .concat(reactionNotifications)
      .concat(blastNotifications)

    // Sort notifications by timestamp (asc)
    notifications.sort(notificationTimestampComparator)
    timer.logMessage(DMPhase.PUSH_NOTIFICATIONS)

    // Send push notifications
    for (const notification of notifications) {
      notification.processNotification({
        isLiveEmailEnabled: false,
        isBrowserPushEnabled
      })
    }

    // Set last indexed timestamps in redis
    setLastIndexedTimestamp(
      redis,
      config.lastIndexedMessageRedisKey,
      cursors.maxTimestamp,
      messageNotifications
    )
    setLastIndexedTimestamp(
      redis,
      config.lastIndexedReactionRedisKey,
      cursors.maxTimestamp,
      reactionNotifications
    )

    if (notifications.length > 0) {
      timer.logMessage(DMPhase.PUSH_NOTIFICATIONS)
      logger.info(
        {
          ...timer.getContext(),
          numberNotifications: notifications.length
        },
        'dmNotifications task: processed new DM push notifications'
      )
    }
  } catch (err) {
    logger.error({
      ...timer.getContext(),
      message: err.message
    })
  }
}
