import { Knex } from 'knex'
import { EmailFrequency } from '../processNotifications/mappers/base'
import { RepostRow, FollowRow, UserRow as DNUserRow, TrackRow, SaveRow } from '../types/dn'
import { UserRow as IdentityUserRow } from '../types/identity'
import { enum_NotificationDeviceTokens_deviceType, NotificationDeviceTokenRow, UserNotificationMobileSettingRow } from '../types/identity'
import { getDB } from '../conn'

export const replaceDBName = (connectionString: string, testName: string) => {
  const connection = connectionString.substring(0, connectionString.lastIndexOf('/'))
  return `${connection}/${testName}`
}

export const createTestDB = async (connectionString: string, testName: string) => {
  const templateDb = /[^/]*$/.exec(connectionString)[0]
  const connection = connectionString.substring(0, connectionString.lastIndexOf('/'))
  const postgresConnection = `${connection}/postgres`
  const db = await getDB(postgresConnection)
  await db.raw('DROP DATABASE IF EXISTS :test_name:', { test_name: testName })
  await db.raw('CREATE DATABASE :test_name: TEMPLATE :template:', { test_name: testName, template: templateDb })
  await db.destroy()
}

export const dropTestDB = async (connectionString: string, testName: string) => {
  const connection = connectionString.substring(0, connectionString.lastIndexOf('/'))
  const postgresConnection = `${connection}/postgres`
  const db = await getDB(postgresConnection)
  await db.raw('DROP DATABASE IF EXISTS :test_name:', { test_name: testName })
  await db.destroy()

}

type CreateTrack = Pick<TrackRow, 'owner_id' | 'track_id'> & Partial<TrackRow>
export const createTracks = async (db: Knex, tracks: CreateTrack[]) => {
  await db.insert(tracks.map(track => ({
    is_delete: false,
    is_current: true,
    created_at: new Date(),
    updated_at: new Date(),
    track_segments: [],
    ...track,
  })))
    .into('tracks')
  await db.insert(tracks.map(track => ({
    is_current: true,
    slug: `track_${track.track_id}`,
    title_slug: `track_${track.track_id}`,
    collision_id: track.track_id,
    blockhash: `0x${track.track_id}`,
    blocknumber: 1,
    txhash: `0x${track.track_id}`,
    track_id: track.track_id,
    owner_id: track.owner_id
  })))
    .into('track_routes')
}

type CreateUser = Pick<DNUserRow, 'user_id'> & Partial<DNUserRow>
export const createUsers = async (db: Knex, users: CreateUser[]) => {
  await db.insert(users.map(user => ({
    is_current: true,
    created_at: new Date(),
    updated_at: new Date(),
    name: `user_${user.user_id}`,
    creator_node_endpoint: `https://dn1.io,https://dn2.io,https://dn3.io`,
    ...user,
  })))
    .into('users')
}


type CreateRepost = Pick<RepostRow, 'user_id' | 'repost_item_id' | 'repost_type'> & Partial<RepostRow>
export const createReposts = async (db: Knex, reposts: CreateRepost[]) => {
  await db.insert(reposts.map(repost => ({
    is_delete: false,
    is_current: true,
    created_at: new Date(),
    ...repost,
  })))
    .into('reposts')
}

type CreateSave = Pick<SaveRow, 'user_id' | 'save_item_id' | 'save_type'> & Partial<SaveRow>
export const createSaves = async (db: Knex, saves: CreateSave[]) => {
  await db.insert(saves.map(save => ({
    is_delete: false,
    is_current: true,
    created_at: new Date(),
    ...save,
  })))
    .into('saves')
}

type CreateFollow = Pick<FollowRow, 'followee_user_id' | 'follower_user_id'> & Partial<FollowRow>
export const insertFollows = async (db: Knex, follows: CreateFollow[]) => {
  await db.insert(follows.map(follow => ({
    is_delete: false,
    is_current: true,
    created_at: new Date(),
    ...follow,
  })))
    .into('follows')
}

export const setUserEmailAndSettings = async (db: Knex, frequency: EmailFrequency, userId: number): Promise<IdentityUserRow> => {
  const user = {
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSeenDate: new Date(),
    handle: `user_${userId}`,
    email: `user_${userId}@gmail.com`,
    blockchainUserId: userId,
  } 
  await db.insert(user).into('Users')
  await db.insert({
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: userId,
    emailFrequency: frequency,
  })
    .into('UserNotificationSettings')
  return user
}

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

type MoblieDevice = Pick<NotificationDeviceTokenRow, 'userId'> & Partial<NotificationDeviceTokenRow>
export async function insertMobileDevices(db: Knex, mobileDevices: MoblieDevice[]) {
  const currentTimestamp = new Date(Date.now()).toISOString()
  await db.insert(mobileDevices.map((device, idx) => ({
    deviceToken: randId().toString(),
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
    deviceType: 'ios',
    awsARN: `arn:${device.userId}`,
    ...device
  })))
    .into('NotificationDeviceTokens')
}

type MobileSetting = Pick<UserNotificationMobileSettingRow, 'userId'> & Partial<UserNotificationMobileSettingRow>
export async function insertMobileSettings(db: Knex, mobileSettings: MobileSetting[]) {
  const currentTimestamp = new Date(Date.now()).toISOString()
  await db.insert(mobileSettings.map(setting => ({
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
    ...setting
  })))
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
  await createUsers(discoveryDB, [
    { user_id: user1, name: user1Name, is_current: true },
    { user_id: user2, name: user2Name, is_current: true }
  ])
  await insertMobileSettings(identityDB, [{ userId: user1 }, { userId: user2 }])
  const deviceType1 = enum_NotificationDeviceTokens_deviceType.ios
  const awsARN1 = "arn:1"
  const deviceType2 = enum_NotificationDeviceTokens_deviceType.android
  const awsARN2 = "arn:2"
  await insertMobileDevices(identityDB, [
    { userId: user1, deviceType: deviceType1, awsARN: awsARN1 },
    { userId: user2, deviceType: deviceType2, awsARN: awsARN2 },
  ])
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
