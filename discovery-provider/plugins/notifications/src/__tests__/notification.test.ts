import { expect, jest, test } from '@jest/globals';
import { Processor } from '../main';
import * as sns from '../sns'
import { getRedisConnection } from './../utils/redisConnection'
import { config } from './../config'
import { randId, clearAllTables, createChat, readChat, insertMessage, insertReaction, setupTwoUsersWithDevices } from '../utils/populateDB';

describe('Notification processor', () => {
  let processor: Processor
  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  beforeEach(async () => {
    const redis = await getRedisConnection()
    redis.del(config.lastIndexedMessageRedisKey)
    redis.del(config.lastIndexedReactionRedisKey)
    console.log('init processor')
    processor = new Processor()
    await processor.init()

    await clearAllTables(processor.discoveryDB)
    await clearAllTables(processor.identityDB)
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await processor.listener.close()
    processor.stop()
  })
  
  // test("Sends app notifications", async () => {
  //   const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
  //     .mockImplementation(() => Promise.resolve())

  //   console.log('start processor')
  //   const processor = new Processor()
  //   await processor.init()
  //   console.log('inserting')
  //   await clearAllTables(processor.discoveryDB)
  //   await clearAllTables(processor.identityDB)
  //   await createUser(processor.discoveryDB, { user_id: 1, is_current: true })
  //   await createUser(processor.discoveryDB, { user_id: 2, is_current: true })
  //   await insertFollow(processor.discoveryDB, 1, 2)
  //   await insertMobileSetting(processor.identityDB, 2)
  //   await insertMobileDevice(processor.identityDB, 2)
  //   await new Promise(resolve => setTimeout(resolve, 10))

  //   const pending = processor.listener.takePending()
  //   expect(pending?.appNotifications).toHaveLength(1)
  //   // Assert single pending
  //   await processor.appNotifications.process(pending.appNotifications)

  //   expect(sendPushNotificationSpy).toHaveBeenCalledWith({
  //     type: 'ios',
  //     targetARN: 'arn:2',
  //     badgeCount: 0
  //   }, {
  //     title: 'Follow',
  //     body: 'user_1 followed you',
  //     data: {}
  //   })

  //   await processor.listener.close()
  // });

  test("Sends DM notifications", async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(processor.discoveryDB, processor.identityDB)

    // Start processor
    console.log('start processor')
    processor.start()
    // Let notifications job run for 1 cycle to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval))

    // User 1 sent message config.dmNotificationDelay mins ago
    const message = "hi from user 1"
    const messageId = randId().toString()
    const messageTimestampMs = Date.now() - config.dmNotificationDelay
    const messageTimestamp = new Date(messageTimestampMs)
    const chatId = randId().toString()
    await createChat(processor.discoveryDB, user1.userId, user2.userId, chatId, messageTimestamp)
    await insertMessage(processor.discoveryDB, user1.userId, chatId, messageId, message, messageTimestamp)

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: user2.deviceType,
      targetARN: user2.awsARN,
      badgeCount: 0
    }, {
      title: 'Message',
      body: `${user1.name}: ${message}`,
      data: {}
    })

    jest.clearAllMocks()

    // User 2 reacted to user 1's message config.dmNotificationDelay mins ago
    const reaction = "fire"
    const reactionTimestampMs = Date.now() - config.dmNotificationDelay
    await insertReaction(processor.discoveryDB, user2.userId, messageId, reaction, new Date(reactionTimestampMs))

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: user1.deviceType,
      targetARN: user1.awsARN,
      badgeCount: 0
    }, {
      title: 'Reaction',
      body: `${user2.name} reacted ${reaction} to your message: ${message}`,
      data: {}
    })
  })

  test("Does not send DM notifications when sender is receiver", async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(processor.discoveryDB, processor.identityDB)

    // Start processor
    console.log('start processor')
    processor.start()
    // Let notifications job run for 1 cycle to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval))

    // User 1 sent message config.dmNotificationDelay mins ago
    const message = "hi from user 1"
    const messageId = randId().toString()
    const messageTimestampMs = Date.now() - config.dmNotificationDelay
    const messageTimestamp = new Date(messageTimestampMs)
    const chatId = randId().toString()
    await createChat(processor.discoveryDB, user1.userId, user2.userId, chatId, messageTimestamp)
    await insertMessage(processor.discoveryDB, user1.userId, chatId, messageId, message, messageTimestamp)

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: user2.deviceType,
      targetARN: user2.awsARN,
      badgeCount: 0
    }, {
      title: 'Message',
      body: `${user1.name}: ${message}`,
      data: {}
    })

    jest.clearAllMocks()

    // User 1 reacted to user 1's message config.dmNotificationDelay mins ago
    const reaction = "fire"
    const reactionTimestampMs = Date.now() - config.dmNotificationDelay
    await insertReaction(processor.discoveryDB, user1.userId, messageId, reaction, new Date(reactionTimestampMs))

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled()
  })

  test("Does not send DM notifications created fewer than delay minutes ago", async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(processor.discoveryDB, processor.identityDB)

    // Start processor
    console.log('start processor')
    processor.start()
    // Let notifications job run for 1 cycle to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval))

    // User 1 sends message now
    const message = "hi from user 1"
    const messageId = randId().toString()
    const messageTimestamp = new Date(Date.now())
    const chatId = randId().toString()
    await createChat(processor.discoveryDB, user1.userId, user2.userId, chatId, messageTimestamp)
    await insertMessage(processor.discoveryDB, user1.userId, chatId, messageId, message, messageTimestamp)

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled
  })

  test("Does not send DM reaction notifications created fewer than delay minutes ago", async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(processor.discoveryDB, processor.identityDB)

    // Set up chat and message
    const message = "hi from user 1"
    const messageId = randId().toString()
    const messageTimestamp = new Date(Date.now())
    const chatId = randId().toString()
    await createChat(processor.discoveryDB, user1.userId, user2.userId, chatId, messageTimestamp)
    await insertMessage(processor.discoveryDB, user1.userId, chatId, messageId, message, messageTimestamp)

    // Start processor
    console.log('start processor')
    processor.start()
    // Let notifications job run for 1 cycle to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval))

    // User 2 reacts to user 1's message now
    const reaction = "fire"
    await insertReaction(processor.discoveryDB, user2.userId, messageId, reaction, new Date(Date.now()))

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled
  })

  test("Does not send DM notifications for messages that have been read", async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(processor.discoveryDB, processor.identityDB)

    // Start processor
    console.log('start processor')
    processor.start()
    // Let notifications job run for 1 cycle to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval))

    // User 1 sent message config.dmNotificationDelay mins ago
    const message = "hi from user 1"
    const messageId = randId().toString()
    const messageTimestampMs = Date.now() - config.dmNotificationDelay
    const messageTimestamp = new Date(messageTimestampMs)
    const chatId = randId().toString()
    await createChat(processor.discoveryDB, user1.userId, user2.userId, chatId, messageTimestamp)
    await insertMessage(processor.discoveryDB, user1.userId, chatId, messageId, message, messageTimestamp)
    // User 2 reads chat
    await readChat(processor.discoveryDB, user2.userId, chatId, new Date(Date.now()))

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled

    jest.clearAllMocks()

    // User 2 reacted to user 1's message config.dmNotificationDelay mins ago
    const reaction = "fire"
    const reactionTimestampMs = Date.now() - config.dmNotificationDelay
    await insertReaction(processor.discoveryDB, user2.userId, messageId, reaction, new Date(reactionTimestampMs))

    // User 1 reads chat
    await readChat(processor.discoveryDB, user1.userId, chatId, new Date(Date.now()))

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled
  })
})
