import { expect, jest, test } from '@jest/globals';
import { Processor } from '../main';
import * as sns from '../sns'
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

    console.log('start processor')
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
    await insertMobileSetting(processor.identityDB, user2)
    await insertMobileDevice(processor.identityDB, user2)

    // Send message 5 mins ago
    const message = "hi from user1"
    const messageId = randId().toString()
    const messageTimestamp = new Date(Date.now() - 300000) // account for 5 min delay in sending DM notifications
    const chatId = randId().toString()
    await createChat(processor.discoveryDB, user1, user2, chatId, messageTimestamp)
    await insertMessage(processor.discoveryDB, user1, chatId, messageId, message, messageTimestamp)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:2',
      badgeCount: 0
    }, {
      title: 'Message',
      body: `${user1Name}: ${message}`,
      data: {}
    })

    // Send reaction 5 mins ago
    const reaction = "fire"
    const reactionTimestamp = new Date(Date.now() - 300000) // account for 5 min delay in sending DM notifications
    await insertReaction(processor.discoveryDB, user1, messageId, reaction, reactionTimestamp)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:2',
      badgeCount: 0
    }, {
      title: 'Reaction',
      body: `${user1Name} reacted ${reaction} to your message: ${message}`,
      data: {}
    })

    // TODO send message now and expect spy not to have been called
    // TODO set user active at and expect spy not to have been called

    await processor.listener.close()
  })
})
