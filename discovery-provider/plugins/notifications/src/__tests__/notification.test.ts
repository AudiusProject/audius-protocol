import { expect, jest, test } from '@jest/globals';
import { Processor } from '../main';
import * as sns from '../sns'
import { getRedisConnection } from './../utils/redisConnection'
import { config } from './../config'
import { randId, clearAllTables, createUser, createChat, insertMessage, insertReaction, insertMobileDevice, insertMobileSetting } from '../utils/populateDB';


describe('Notification processor', () => {
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
    const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
      .mockImplementation(() => Promise.resolve())

    console.log('init processor')
    const processor = new Processor()
    await processor.init()

    console.log('inserting')
    await clearAllTables(processor.discoveryDB)
    await clearAllTables(processor.identityDB)
    const user1 = randId()
    const user1Name = "fee"
    const user2 = randId()
    const user2Name = "fi"
    await createUser(processor.discoveryDB, { user_id: user1, name: user1Name, is_current: true })
    await createUser(processor.discoveryDB, { user_id: user2, name: user2Name, is_current: true })
    await insertMobileSetting(processor.identityDB, user1)
    await insertMobileSetting(processor.identityDB, user2)
    const deviceType1 = "ios"
    const awsARN1 = "arn:1"
    await insertMobileDevice(processor.identityDB, user1, deviceType1, awsARN1)
    const deviceType2 = "android"
    const awsARN2 = "arn:2"
    await insertMobileDevice(processor.identityDB, user2, deviceType2, awsARN2)

    // Start processor
    console.log('start processor')
    processor.start()
    // Let notifications job run for 1 cycle to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval))

    // User 1 sent message config.dmNotificationDelay mins ago
    const message = "hi from user 1"
    const messageId = randId().toString()
    const messageTimestampMs = Date.now() - config.dmNotificationDelay // 5 min delay in ms
    const messageTimestamp = new Date(messageTimestampMs)
    const chatId = randId().toString()
    await createChat(processor.discoveryDB, user1, user2, chatId, messageTimestamp)
    await insertMessage(processor.discoveryDB, user1, chatId, messageId, message, messageTimestamp)

    await new Promise((r) => setTimeout(r, config.pollInterval))
    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: deviceType2,
      targetARN: awsARN2,
      badgeCount: 0
    }, {
      title: 'Message',
      body: `${user1Name}: ${message}`,
      data: {}
    })

    // User 2 reacted to user 1's message config.dmNotificationDelay mins ago
    const reaction = "fire"
    const reactionTimestampMs = Date.now() - config.dmNotificationDelay
    await insertReaction(processor.discoveryDB, user2, messageId, reaction, new Date(reactionTimestampMs))

    await new Promise((r) => setTimeout(r, config.pollInterval))
    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: deviceType1,
      targetARN: awsARN1,
      badgeCount: 0
    }, {
      title: 'Reaction',
      body: `${user2Name} reacted ${reaction} to your message: ${message}`,
      data: {}
    })

    // TODO assert no notifs when messaging self or reacting to own message
    // TODO send message now and expect spy not to have been called
    // TODO set user active at and expect spy not to have been called

    await processor.listener.close()
    processor.stop()
  })
})
