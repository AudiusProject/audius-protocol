import { Knex } from 'knex'
import { UserRow } from '../types/dn'

// Generate random Id betweeen 0 and 999
export function randId() {
  return Math.floor(Math.random() * 1000)
}

export async function clearAllTables(db: Knex) {
  await db.raw(
    `
      DO
      $func$
      BEGIN
        EXECUTE
        (
          SELECT 'TRUNCATE TABLE ' || string_agg(format('%I.%I', table_schema, table_name), ', ') || ' RESTART IdENTITY CASCADE'
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        );
      END
      $func$;
    `
  )
}

export async function createUser(db: Knex, metadata: UserRow) {
  await db.insert(metadata).into('users')
}

export async function createChat(db: Knex, user1: number, user2: number, chatId: string, timestamp: Date) {
  await db.insert(
    {
      chat_id: chatId,
      created_at: timestamp.toISOString(),
      last_message_at: timestamp.toISOString(),
    }
    )
    .into('chat')

  await db.insert([
    {
      chat_id: chatId,
      invited_by_user_id: user1,
      invite_code: chatId,
      user_id: user1
    },
    {
      chat_id: chatId,
      invited_by_user_id: user1,
      invite_code: chatId,
      user_id: user2
    }
    ])
    .into('chat_member')
}

export async function readChat(db: Knex, userId: number, chatId: string, timestamp: Date) {
  await db('chat_member')
    .where({
      user_id: userId,
      chat_id: chatId
    })
    .update({
      last_active_at: timestamp.toISOString()
    })
}

export async function insertMessage(db: Knex, senderId: number, chatId: string, messageId: string, message: string, timestamp: Date) {
  await db.insert(
    {
      message_id: messageId,
      chat_id: chatId,
      user_id: senderId,
      created_at: timestamp.toISOString(),
      ciphertext: message
    }
    )
    .into('chat_message')

  await db('chat')
    .where({
      chat_id: chatId
    })
    .update({
      last_message_at: timestamp.toISOString()
    })
}

export async function insertReaction(db: Knex, senderId: number, messageId: string, reaction: string, timestamp: Date) {
  await db.insert(
    {
      user_id: senderId,
      message_id: messageId,
      reaction: reaction,
      created_at: timestamp.toISOString(),
      updated_at: timestamp.toISOString()
    }
    )
    .into('chat_message_reactions')
}

export async function insertMobileDevice(db: Knex, userId: number, deviceType: string, awsARN: string) {
  const currentTimestamp = new Date(Date.now()).toISOString()
  await db.insert(
    {
      userId: userId,
      deviceToken: randId().toString(),
      deviceType: deviceType,
      awsARN: awsARN,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    }
    )
    .into('NotificationDeviceTokens')
}

export async function insertMobileSetting(db: Knex, userId: number) {
  const currentTimestamp = new Date(Date.now()).toISOString()
  await db.insert(
    {
      userId: userId,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    }
    )
    .into('UserNotificationMobileSettings')
}
