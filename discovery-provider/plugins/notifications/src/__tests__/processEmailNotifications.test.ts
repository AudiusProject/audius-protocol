import { expect, jest, test } from '@jest/globals';
import { Knex } from 'knex'

import { DMEntityType } from '../email/notifications/types'
import { config } from '../config'
import { getDB } from '../conn'
import * as sendEmail from '../email/notifications/sendEmail'
import { processEmailNotifications } from '../email/notifications/index'
import { createTestDB, dropTestDB, replaceDBName, randId, createUsers, createChat, readChat, insertMessage, insertReaction, setUserEmailAndSettings } from '../utils/populateDB';

describe('Email Notifications', () => {
  let discoveryDB: Knex
  let identityDB: Knex
  beforeEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      createTestDB(process.env.DN_DB_URL, testName),
      createTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
    const discoveryDBUrl = replaceDBName(process.env.DN_DB_URL, testName)
    const identityDBUrl = replaceDBName(process.env.IDENTITY_DB_URL, testName)
    discoveryDB = await getDB(discoveryDBUrl)
    identityDB = await getDB(identityDBUrl)
  })

  afterEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      dropTestDB(process.env.DN_DB_URL, testName),
      dropTestDB(process.env.IDENTITY_DB_URL, testName),
    ])
  })

  test("Process new message", async () => {
    try {
      const sendNotificationEmailSpy = jest.spyOn(sendEmail, 'sendNotificationEmail')
        .mockImplementation(() => Promise.resolve(true))

      const user1 = 1
      const user2 = 2
      const frequency = 'live'
      await createUsers(discoveryDB, [{ user_id: user1 }, { user_id: user2 }])
      const { email: user2Email } = await setUserEmailAndSettings(identityDB, frequency, user2)
      // User 1 sent message config.dmNotificationDelay mins ago
      const message = "hi from user 1"
      const messageId = randId().toString()
      const messageTimestamp = new Date(Date.now() - config.dmNotificationDelay)
      const chatId = randId().toString()
      await createChat(discoveryDB, user1, user2, chatId, messageTimestamp)
      await insertMessage(discoveryDB, user1, chatId, messageId, message, messageTimestamp)

      const expectedNotifications = [{
        type: DMEntityType.Message,
        sender_user_id: user1,
        receiver_user_id: user2
      }]
      await processEmailNotifications(discoveryDB, identityDB, frequency)
      expect(sendNotificationEmailSpy).toHaveBeenCalledWith({
        userId: user2,
        email: user2Email,
        frequency: frequency,
        notifications: expectedNotifications,
        dnDb: discoveryDB
      })
    } finally {
      jest.clearAllMocks()
      await discoveryDB.destroy()
      await identityDB.destroy()
    }
  })

  test("Process new reaction", async () => {
    try {
      const sendNotificationEmailSpy = jest.spyOn(sendEmail, 'sendNotificationEmail')
        .mockImplementation(() => Promise.resolve(true))

      const user1 = 1
      const user2 = 2
      const frequency = 'live'
      await createUsers(discoveryDB, [{ user_id: user1 }, { user_id: user2 }])
      const { email: user1Email } = await setUserEmailAndSettings(identityDB, frequency, user1)
      await setUserEmailAndSettings(identityDB, frequency, user2)
      // User 1 sent message config.dmNotificationDelay ms ago
      const message = "hi from user 1"
      const messageId = randId().toString()
      const messageTimestamp = new Date(Date.now() - config.dmNotificationDelay)
      const chatId = randId().toString()
      await createChat(discoveryDB, user1, user2, chatId, messageTimestamp)
      await insertMessage(discoveryDB, user1, chatId, messageId, message, messageTimestamp)

      // User 2 read chat config.dmNotificationDelay ms ago
      const reactionTimestamp = new Date(Date.now() - config.dmNotificationDelay)
      await readChat(discoveryDB, user2, chatId, reactionTimestamp)

      // User 2 reacted to user 1's message config.dmNotificationDelay ms ago
      const reaction = "heart"
      await insertReaction(discoveryDB, user2, messageId, reaction, reactionTimestamp)

      const expectedNotifications = [{
        type: DMEntityType.Reaction,
        sender_user_id: user2,
        receiver_user_id: user1
      }]
      await processEmailNotifications(discoveryDB, identityDB, frequency)
      // No message notification because user 2 read the chat
      expect(sendNotificationEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendNotificationEmailSpy).toHaveBeenCalledWith({
        userId: user1,
        email: user1Email,
        frequency: frequency,
        notifications: expectedNotifications,
        dnDb: discoveryDB
      })
    } finally {
      jest.clearAllMocks()
      await discoveryDB.destroy()
      await identityDB.destroy()
    }
  })

  // test("Process new follow", async () => {

  // })

  test("Process multiple events", async () => {
    try {
      const sendNotificationEmailSpy = jest.spyOn(sendEmail, 'sendNotificationEmail')
        .mockImplementation(() => Promise.resolve(true))

      const user1 = 1
      const user2 = 2
      const frequency = 'live'
      await createUsers(discoveryDB, [{ user_id: user1 }, { user_id: user2 }])
      const { email: user2Email } = await setUserEmailAndSettings(identityDB, frequency, user2)
      // User 1 sent two messages config.dmNotificationDelay ms ago
      const message1 = "hi from user 1"
      const message1Id = randId().toString()
      const message1Timestamp = new Date(Date.now() - config.dmNotificationDelay)
      const chatId = randId().toString()
      await createChat(discoveryDB, user1, user2, chatId, message1Timestamp)
      await insertMessage(discoveryDB, user1, chatId, message1Id, message1, message1Timestamp)
      const message2 = "hello again"
      const message2Id = randId().toString()
      const message2Timestamp = new Date(Date.now() - config.dmNotificationDelay)
      await insertMessage(discoveryDB, user1, chatId, message2Id, message2, message2Timestamp)

      const expectedNotifications = [
        {
          type: DMEntityType.Message,
          sender_user_id: user1,
          receiver_user_id: user2
        },
        {
          type: DMEntityType.Message,
          sender_user_id: user1,
          receiver_user_id: user2
        }
      ]

      await processEmailNotifications(discoveryDB, identityDB, frequency)
      expect(sendNotificationEmailSpy).toHaveBeenCalledWith({
        userId: user2,
        email: user2Email,
        frequency: frequency,
        notifications: expectedNotifications,
        dnDb: discoveryDB
      })
    } finally {
      jest.clearAllMocks()
      await discoveryDB.destroy()
      await identityDB.destroy()
    }
  })
})
