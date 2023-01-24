import { expect, test } from '@jest/globals';
import { Processor } from '../main';
import * as sns from '../sns'
import { randID, clearAllTables, createUser, insertFollow, createChat, insertMessage, insertReaction, readChat, insertMobileDevice, insertMobileSetting } from '../utils/populateDB';


test("App notification processor", async () => {
  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  console.log('start processor')
  const processor = new Processor()
  await processor.init()
  console.log('inserting')
  await clearAllTables(processor.discoveryDB)
  await clearAllTables(processor.identityDB)
  await createUser(processor.discoveryDB, { user_id: 1 })
  await createUser(processor.discoveryDB, { user_id: 2 })
  await insertFollow(processor.discoveryDB, 1, 2)
  await insertMobileSetting(processor.identityDB, 2)
  await insertMobileDevice(processor.identityDB, 2)
  await new Promise(resolve => setTimeout(resolve, 10))

  const pending = processor.listener.takePending()
  expect(pending?.appNotifications).toHaveLength(1)
  // Assert single pending
  await processor.appNotifications.process(pending.appNotifications)

  expect(sendPushNotificationSpy).toHaveBeenCalledWith({
    type: 'ios',
    targetARN: 'arn:2',
    badgeCount: 0
  }, {
    title: 'Follow',
    body: 'user_1 followed you',
    data: {}
  })

  await processor.listener.close()

});

test("DM notification processor", async () => {
  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  console.log('start processor')
  const processor = new Processor()
  await processor.init()

  console.log('inserting')
  await clearAllTables(processor.discoveryDB)
  await clearAllTables(processor.identityDB)
  const user1 = randID()
  const user1Name = "fee"
  const user2 = randID()
  const user2Name = "fi"
  await createUser(processor.discoveryDB, { user_id: user1, name: user1Name, is_current: true })
  await createUser(processor.discoveryDB, { user_id: user2, name: user2Name, is_current: true })
  await insertMobileSetting(processor.identityDB, user2)
  await insertMobileDevice(processor.identityDB, user2)

  // Send message 5 mins ago
  const message = "hi from user1"
  const messageID = randID()
  const messageTimestamp = Date.now() - 300000 // account for 5 min delay in sending DM notifications
  const chatID = await createChat(processor.discoveryDB, user1, user2, messageTimestamp)
  await insertMessage(processor.discoveryDB, user1, user2, chatID, messageID, message, messageTimestamp)
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
  const reactionTimestamp = Date.now() - 300000 // account for 5 min delay in sending DM notifications
  await insertReaction(processor.discoveryDB, user1, user2, messageID, reaction, reactionTimestamp)
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
