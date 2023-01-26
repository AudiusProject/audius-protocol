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

export type UserWithDevice = {
  userId: number,
  name: string,
  deviceType: string,
  awsARN: string
}

export async function setupTwoUsersWithDevices(discoveryDB: Knex, identityDB: Knex): Promise<{ user1: UserWithDevice, user2: UserWithDevice }> {
  const user1 = randId()
  const user1Name = "user 1"
  const user2 = randId()
  const user2Name = "user 2"
  await createUser(discoveryDB, { user_id: user1, name: user1Name, is_current: true })
  await createUser(discoveryDB, { user_id: user2, name: user2Name, is_current: true })
  await insertMobileSetting(identityDB, user1)
  await insertMobileSetting(identityDB, user2)
  const deviceType1 = "ios"
  const awsARN1 = "arn:1"
  await insertMobileDevice(identityDB, user1, deviceType1, awsARN1)
  const deviceType2 = "android"
  const awsARN2 = "arn:2"
  await insertMobileDevice(identityDB, user2, deviceType2, awsARN2)
  return {
    user1: {
      userId: user1,
      name: user1Name,
      deviceType: deviceType1,
      awsARN: awsARN1
    },
    user2: {
      userId: user2,
      name: user2Name,
      deviceType: deviceType2,
      awsARN: awsARN2
    }
  }
}
