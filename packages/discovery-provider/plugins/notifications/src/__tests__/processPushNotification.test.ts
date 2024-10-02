import { expect, jest, test } from '@jest/globals'
import { Processor } from '../main'
import * as sns from '../sns'
import { config } from './../config'
import {
  createChat,
  readChat,
  insertMessage,
  insertReaction,
  insertBlast,
  setupTwoUsersWithDevices,
  setupTest,
  resetTests,
  insertFollows,
  insertChatPermission,
  createUsers,
  setupNUsersWithDevices
} from '../utils/populateDB'

describe('Push Notifications', () => {
  let processor: Processor
  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  beforeEach(async () => {
    const setup = await setupTest({ mockTime: false })
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  // test('Process DM for ios', async () => {
  //   const { user1, user2 } = await setupTwoUsersWithDevices(
  //     processor.discoveryDB,
  //     processor.identityDB
  //   )

  //   // Start processor
  //   processor.start()
  //   // Let notifications job run for a few cycles to initialize the min cursors in redis
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // User 1 sent message config.dmNotificationDelay ms ago
  //   const message = 'hi from user 1'
  //   const messageId = '1'
  //   const messageTimestampMs = Date.now() - config.dmNotificationDelay
  //   const messageTimestamp = new Date(messageTimestampMs)
  //   const chatId = '1'
  //   await createChat(
  //     processor.discoveryDB,
  //     user1.userId,
  //     user2.userId,
  //     chatId,
  //     messageTimestamp
  //   )
  //   await insertMessage(
  //     processor.discoveryDB,
  //     user1.userId,
  //     chatId,
  //     messageId,
  //     message,
  //     messageTimestamp
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
  //   expect(sendPushNotificationSpy).toHaveBeenCalledWith(
  //     {
  //       type: user2.deviceType,
  //       targetARN: user2.awsARN,
  //       badgeCount: 1
  //     },
  //     {
  //       title: 'Message',
  //       body: `New message from ${user1.name}`,
  //       data: {
  //         type: 'Message',
  //         chatId
  //       }
  //     }
  //   )

  //   jest.clearAllMocks()

  //   // User 2 reacted to user 1's message config.dmNotificationDelay ms ago
  //   const reaction = '🔥'
  //   const reactionTimestampMs = Date.now() - config.dmNotificationDelay
  //   await insertReaction(
  //     processor.discoveryDB,
  //     user2.userId,
  //     messageId,
  //     reaction,
  //     new Date(reactionTimestampMs)
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
  //   expect(sendPushNotificationSpy).toHaveBeenCalledWith(
  //     {
  //       type: user1.deviceType,
  //       targetARN: user1.awsARN,
  //       badgeCount: 1
  //     },
  //     {
  //       title: 'Reaction',
  //       body: `${user2.name} reacted ${reaction}`,
  //       data: {
  //         type: 'MessageReaction',
  //         chatId,
  //         messageId
  //       }
  //     }
  //   )

  //   jest.clearAllMocks()
  // }, 40000)

  // test('Process chat blast notification', async () => {
  //   const { user1, user2 } = await setupTwoUsersWithDevices(
  //     processor.discoveryDB,
  //     processor.identityDB
  //   )

  //   // Start processor
  //   processor.start()
  //   // Let notifications job run for a few cycles to initialize the min cursors in redis
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   await insertFollows(processor.discoveryDB, [
  //     { follower_user_id: user2.userId, followee_user_id: user1.userId }
  //   ])

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   // User 1 sent message config.dmNotificationDelay ms ago
  //   const message = 'hi from user 1'
  //   const blastId = '1'
  //   const messageTimestampMs = Date.now() - config.dmNotificationDelay
  //   const messageTimestamp = new Date(messageTimestampMs)
  //   const audience = 'follower_audience'
  //   await insertBlast(
  //     processor.discoveryDB,
  //     user1.userId,
  //     blastId,
  //     message,
  //     audience,
  //     undefined,
  //     undefined,
  //     messageTimestamp
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   expect(sendPushNotificationSpy).toHaveBeenCalledTimes(2)
  //   expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
  //     2,
  //     {
  //       type: user2.deviceType,
  //       targetARN: user2.awsARN,
  //       badgeCount: 1
  //     },
  //     {
  //       title: 'Message',
  //       body: `New message from ${user1.name}`,
  //       data: {
  //         type: 'Message'
  //       }
  //     }
  //   )

  //   // User 2 only allows tippers to message them
  //   await insertChatPermission(processor.discoveryDB, user2.userId, 'tippers')

  //   // User 1 sent message config.dmNotificationDelay ms ago
  //   const message2 = 'please let me DM you'
  //   const blastId2 = '2'
  //   const messageTimestampMs2 = Date.now() - config.dmNotificationDelay
  //   const messageTimestamp2 = new Date(messageTimestampMs2)
  //   await insertBlast(
  //     processor.discoveryDB,
  //     user1.userId,
  //     blastId2,
  //     message2,
  //     audience,
  //     undefined,
  //     undefined,
  //     messageTimestamp2
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // No new notifications
  //   expect(sendPushNotificationSpy).toHaveBeenCalledTimes(2)
  //   jest.clearAllMocks()
  // }, 40000)

  // test('Test blast with existing chat', async () => {
  //   const { user1, user2 } = await setupTwoUsersWithDevices(
  //     processor.discoveryDB,
  //     processor.identityDB
  //   )

  //   // Start processor
  //   processor.start()
  //   // Let notifications job run for a few cycles to initialize the min cursors in redis
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // user2 follows user1
  //   await insertFollows(processor.discoveryDB, [
  //     { follower_user_id: user2.userId, followee_user_id: user1.userId }
  //   ])
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   // Follow generates a notification
  //   expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)

  //   // Create a chat thread
  //   const message = 'hi from user 1'
  //   const messageTimestampMs = Date.now()
  //   const messageTimestamp = new Date(messageTimestampMs)
  //   const chatId = '1'
  //   await createChat(
  //     processor.discoveryDB,
  //     user1.userId,
  //     user2.userId,
  //     chatId,
  //     messageTimestamp
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // If the users have an existing chat thread and user1 sends a blast,
  //   // in the real world user2 should receive a normal message notification
  //   // from the blast fan-out, but that doesn't work in jest, so just confirm no
  //   // new message notifications are sent
  //   const blastId = '1'
  //   const blastTimestampMs = Date.now() - config.dmNotificationDelay
  //   const blastTimestamp = new Date(blastTimestampMs)
  //   const audience = 'follower_audience'
  //   await insertBlast(
  //     processor.discoveryDB,
  //     user1.userId,
  //     blastId,
  //     message,
  //     audience,
  //     undefined,
  //     undefined,
  //     blastTimestamp
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)

  //   jest.clearAllMocks()
  // }, 40000)

  test('Test many blasts ', async () => {
    jest.clearAllMocks()
    const numUsers = 10
    setupNUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB,
      numUsers
    )

    // All users follow user 0
    for (let i = 1; i < numUsers; i++) {
      await insertFollows(processor.discoveryDB, [
        { follower_user_id: i, followee_user_id: 0 }
      ])
    }

    // Start processor
    processor.start()
    // Let notifications job run for a few cycles to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // Follow notifs
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(numUsers - 1)

    // If the users have an existing chat thread and user1 sends a blast,
    // in the real world user2 should receive a normal message notification
    // from the blast fan-out, but that doesn't work in jest, so just confirm no
    // new message notifications are sent
    const blastId = '0'
    const blastTimestampMs = Date.now() - config.dmNotificationDelay
    const blastTimestamp = new Date(blastTimestampMs)
    const audience = 'follower_audience'
    const message = 'hi from user 0'
    await insertBlast(
      processor.discoveryDB,
      0,
      blastId,
      message,
      audience,
      undefined,
      undefined,
      blastTimestamp
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    expect(sendPushNotificationSpy).toHaveBeenCalledTimes((numUsers - 1) * 2)

    jest.clearAllMocks()
  }, 40000)

  // test('Does not send DM notifications when sender is receiver', async () => {
  //   const { user1, user2 } = await setupTwoUsersWithDevices(
  //     processor.discoveryDB,
  //     processor.identityDB
  //   )

  //   // Start processor
  //   processor.start()
  //   // Let notifications job run for a few cycles to initialize the min cursors in redis
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // User 1 sent message config.dmNotificationDelay ms ago
  //   const message = 'hi from user 1'
  //   const messageId = '1'
  //   const messageTimestampMs = Date.now() - config.dmNotificationDelay
  //   const messageTimestamp = new Date(messageTimestampMs)
  //   const chatId = '1'
  //   await createChat(
  //     processor.discoveryDB,
  //     user1.userId,
  //     user2.userId,
  //     chatId,
  //     messageTimestamp
  //   )
  //   await insertMessage(
  //     processor.discoveryDB,
  //     user1.userId,
  //     chatId,
  //     messageId,
  //     message,
  //     messageTimestamp
  //   )

  //   // expanded timeout because timeout was faster than delay
  //   // see 'Does not send DM reaction notifications created fewer than delay minutes ago' test for why
  //   // the spy might not have been called
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 5))
  //   expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
  //   expect(sendPushNotificationSpy).toHaveBeenCalledWith(
  //     {
  //       type: user2.deviceType,
  //       targetARN: user2.awsARN,
  //       badgeCount: 1
  //     },
  //     {
  //       title: 'Message',
  //       body: `New message from ${user1.name}`,
  //       data: {
  //         type: 'Message',
  //         chatId
  //       }
  //     }
  //   )

  //   jest.clearAllMocks()

  //   // User 1 reacted to user 1's message config.dmNotificationDelay ms ago
  //   const reaction = '🔥'
  //   const reactionTimestampMs = Date.now() - config.dmNotificationDelay
  //   await insertReaction(
  //     processor.discoveryDB,
  //     user1.userId,
  //     messageId,
  //     reaction,
  //     new Date(reactionTimestampMs)
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   expect(sendPushNotificationSpy).not.toHaveBeenCalled()
  // }, 40000)

  // test('Does not send DM notifications created fewer than delay minutes ago', async () => {
  //   const { user1, user2 } = await setupTwoUsersWithDevices(
  //     processor.discoveryDB,
  //     processor.identityDB
  //   )

  //   // Start processor
  //   processor.start()
  //   // Let notifications job run for a few cycles to initialize the min cursors in redis
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // User 1 sends message now
  //   const message = 'hi from user 1'
  //   const messageId = '1'
  //   const messageTimestamp = new Date(Date.now())
  //   const chatId = '1'
  //   await createChat(
  //     processor.discoveryDB,
  //     user1.userId,
  //     user2.userId,
  //     chatId,
  //     messageTimestamp
  //   )
  //   await insertMessage(
  //     processor.discoveryDB,
  //     user1.userId,
  //     chatId,
  //     messageId,
  //     message,
  //     messageTimestamp
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   expect(sendPushNotificationSpy).not.toHaveBeenCalled
  // })

  // test('Does not send DM reaction notifications created fewer than delay minutes ago', async () => {
  //   const { user1, user2 } = await setupTwoUsersWithDevices(
  //     processor.discoveryDB,
  //     processor.identityDB
  //   )

  //   // Set up chat and message
  //   const message = 'hi from user 1'
  //   const messageId = '1'
  //   const messageTimestamp = new Date(Date.now())
  //   const chatId = '1'
  //   await createChat(
  //     processor.discoveryDB,
  //     user1.userId,
  //     user2.userId,
  //     chatId,
  //     messageTimestamp
  //   )
  //   await insertMessage(
  //     processor.discoveryDB,
  //     user1.userId,
  //     chatId,
  //     messageId,
  //     message,
  //     messageTimestamp
  //   )

  //   // Start processor
  //   processor.start()
  //   // Let notifications job run for a few cycles to initialize the min cursors in redis
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // User 2 reacts to user 1's message now
  //   const reaction = '🔥'
  //   await insertReaction(
  //     processor.discoveryDB,
  //     user2.userId,
  //     messageId,
  //     reaction,
  //     new Date(Date.now())
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   expect(sendPushNotificationSpy).not.toHaveBeenCalled
  // })

  // test('Does not send DM notifications for messages that have been read', async () => {
  //   const { user1, user2 } = await setupTwoUsersWithDevices(
  //     processor.discoveryDB,
  //     processor.identityDB
  //   )

  //   // Start processor
  //   processor.start()
  //   // Let notifications job run for a few cycles to initialize the min cursors in redis
  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))

  //   // User 1 sent message config.dmNotificationDelay ms ago
  //   const message = 'hi from user 1'
  //   const messageId = '1'
  //   const messageTimestampMs = Date.now() - config.dmNotificationDelay
  //   const messageTimestamp = new Date(messageTimestampMs)
  //   const chatId = '1'
  //   await createChat(
  //     processor.discoveryDB,
  //     user1.userId,
  //     user2.userId,
  //     chatId,
  //     messageTimestamp
  //   )
  //   await insertMessage(
  //     processor.discoveryDB,
  //     user1.userId,
  //     chatId,
  //     messageId,
  //     message,
  //     messageTimestamp
  //   )
  //   // User 2 reads chat
  //   await readChat(
  //     processor.discoveryDB,
  //     user2.userId,
  //     chatId,
  //     new Date(Date.now())
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   expect(sendPushNotificationSpy).not.toHaveBeenCalled

  //   jest.clearAllMocks()

  //   // User 2 reacted to user 1's message config.dmNotificationDelay ms ago
  //   const reaction = '🔥'
  //   const reactionTimestampMs = Date.now() - config.dmNotificationDelay
  //   await insertReaction(
  //     processor.discoveryDB,
  //     user2.userId,
  //     messageId,
  //     reaction,
  //     new Date(reactionTimestampMs)
  //   )

  //   // User 1 reads chat
  //   await readChat(
  //     processor.discoveryDB,
  //     user1.userId,
  //     chatId,
  //     new Date(Date.now())
  //   )

  //   await new Promise((r) => setTimeout(r, config.pollInterval * 2))
  //   expect(sendPushNotificationSpy).not.toHaveBeenCalled
  // })
})
