import { Knex } from 'knex'
import { HashId } from '@audius/sdk'
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
  console.log('REED at top of getNewBlasts')
  const messages = await discoveryDB
    .with('all_new', function () {
      this.select(
        'blast.from_user_id as sender_user_id',
        'users.id as receiver_user_id',
        'blast.created_at as timestamp'
      )
        .from('chat_blast as blast')
        .where(function () {
          // follower_audience
          this.whereIn('from_user_id', function () {
            this.select('followee_user_id')
              .from('follows')
              .where('blast.audience', 'follower_audience')
              .andWhereRaw('follows.followee_user_id = blast.from_user_id')
              .andWhereRaw('follows.follower_user_id = users.id')
              .andWhere('follows.is_delete', false)
              .andWhereRaw('follows.created_at < blast.created_at')
          })
            // tipper_audience
            .orWhereIn('from_user_id', function () {
              this.select('receiver_user_id')
                .from('user_tips as tip')
                .where('blast.audience', 'tipper_audience')
                .andWhereRaw('receiver_user_id = blast.from_user_id')
                .andWhereRaw('sender_user_id = users.id')
                .andWhereRaw('tip.created_at < blast.created_at')
            })
            // remixer_audience
            .orWhereIn('from_user_id', function () {
              this.select('og.owner_id')
                .from('tracks as t')
                .join('remixes', 'remixes.child_track_id', 't.track_id')
                .join('tracks as og', 'remixes.parent_track_id', 'og.track_id')
                .where('blast.audience', 'remixer_audience')
                .andWhereRaw('og.owner_id = blast.from_user_id')
                .andWhereRaw('t.owner_id = users.id')
                .andWhere(function () {
                  this.whereNull('blast.audience_content_id').orWhere(
                    function () {
                      this.where(
                        'blast.audience_content_type',
                        'track'
                      ).andWhereRaw('blast.audience_content_id = og.track_id')
                    }
                  )
                })
            })
            // customer_audience
            .orWhereIn('from_user_id', function () {
              this.select('seller_user_id')
                .from('usdc_purchases as p')
                .where('blast.audience', 'customer_audience')
                .andWhereRaw('p.seller_user_id = blast.from_user_id')
                .andWhereRaw('p.buyer_user_id = users.id')
                .andWhere(function () {
                  this.whereNull('blast.audience_content_id').orWhere(
                    function () {
                      this.whereRaw(
                        'blast.audience_content_type = p.content_type::text'
                      ).andWhereRaw('blast.audience_content_id = p.content_id')
                    }
                  )
                })
            })
        })
    })
    .select(
      'all_new.sender_user_id',
      'all_new.receiver_user_id',
      'all_new.timestamp'
    )
    .from('all_new')
    .join(
      'users',
      'users.user_id',
      discoveryDB.raw('chat_allowed(from_user_id, users.user_id)')
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
  console.log('REED before calculating chatId', { messages })
  const messages2 = messages.map((message) => {
    let chatId: string
    if (message.sender_user_id < message.receiver_user_id) {
      chatId =
        HashId.parse(message.sender_user_id) +
        ':' +
        HashId.parse(message.receiver_user_id)
    } else {
      chatId =
        HashId.parse(message.receiver_user_id) +
        ':' +
        HashId.parse(message.sender_user_id)
    }
    return { ...message, chatId }
  })
  console.log('REED after calculating chatId', { messages2 })

  return messages2
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
