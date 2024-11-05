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

  test('Process DM for ios', async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // Start processor
    processor.start()
    // Let notifications job run for a few cycles to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // User 1 sent message config.dmNotificationDelay ms ago
    const message = 'hi from user 1'
    const messageId = '1'
    const messageTimestampMs = Date.now() - config.dmNotificationDelay
    const messageTimestamp = new Date(messageTimestampMs)
    const chatId = '1'
    await createChat(
      processor.discoveryDB,
      user1.userId,
      user2.userId,
      chatId,
      messageTimestamp
    )
    await insertMessage(
      processor.discoveryDB,
      user1.userId,
      chatId,
      messageId,
      message,
      messageTimestamp
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: user2.deviceType,
        targetARN: user2.awsARN,
        badgeCount: 1
      },
      {
        title: 'Message',
        body: `New message from ${user1.name}`,
        data: {
          type: 'Message',
          chatId
        }
      }
    )

    // User 2 reacted to user 1's message config.dmNotificationDelay ms ago
    const reaction = '🔥'
    const reactionTimestampMs = Date.now() - config.dmNotificationDelay
    await insertReaction(
      processor.discoveryDB,
      user2.userId,
      messageId,
      reaction,
      new Date(reactionTimestampMs)
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(2)
    expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
      2,
      {
        type: user1.deviceType,
        targetARN: user1.awsARN,
        badgeCount: 1
      },
      {
        title: 'Reaction',
        body: `${user2.name} reacted ${reaction}`,
        data: {
          type: 'MessageReaction',
          chatId,
          messageId
        }
      }
    )

    await insertFollows(processor.discoveryDB, [
      { follower_user_id: user2.userId, followee_user_id: user1.userId }
    ])
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // Follow notif
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(3)
    const blast = 'hi from user 1'
    const blastId = '1'
    const blastTimestampMs = Date.now() - config.dmNotificationDelay
    const blastTimestamp = new Date(blastTimestampMs)
    const audience = 'follower_audience'
    await insertBlast(
      processor.discoveryDB,
      user1.userId,
      blastId,
      blast,
      audience,
      undefined,
      undefined,
      blastTimestamp
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    // Ensure this only produces one notif from the blast, no dup notifs from the blast fan-out
    // as 1-1 message notifs should ignore blasts
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(4)
    expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
      4,
      { badgeCount: 2, targetARN: user2.awsARN, type: user2.deviceType },
      {
        title: 'Message',
        body: `New message from ${user1.name}`,
        data: expect.objectContaining({
          chatId: '7eP5n:ML51L',
          type: 'Message'
        })
      }
    )
  }, 40000)

  test('Process chat blast notification', async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // Start processor
    processor.start()
    // Let notifications job run for a few cycles to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    await insertFollows(processor.discoveryDB, [
      { follower_user_id: user2.userId, followee_user_id: user1.userId }
    ])

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // follow notification
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)

    // User 1 sent message config.dmNotificationDelay ms ago
    const message = 'hi from user 1'
    const blastId = '1'
    const messageTimestampMs = Date.now() - config.dmNotificationDelay
    const messageTimestamp = new Date(messageTimestampMs)
    const audience = 'follower_audience'
    await insertBlast(
      processor.discoveryDB,
      user1.userId,
      blastId,
      message,
      audience,
      undefined,
      undefined,
      messageTimestamp
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // Expect 1 follow notif and 1 blast message notif
    // expect(sendPushNotificationSpy).toHaveBeenCalledTimes(2)
    const calls = sendPushNotificationSpy.mock.calls
    const expectedCalls = [
      [
        expect.objectContaining({
          type: user1.deviceType,
          targetARN: user1.awsARN,
          badgeCount: 1
        }),
        expect.objectContaining({
          title: 'New Follow',
          body: `${user2.name} followed you`,
          data: expect.objectContaining({
            type: 'Follow'
          })
        })
      ],
      [
        expect.objectContaining({
          type: user2.deviceType,
          targetARN: user2.awsARN,
          badgeCount: 1
        }),
        expect.objectContaining({
          title: 'Message',
          body: `New message from ${user1.name}`,
          data: expect.objectContaining({
            type: 'Message'
          })
        })
      ]
    ]
    expect(calls).toEqual(expect.arrayContaining(expectedCalls))

    // User 2 only allows tippers to message them
    await insertChatPermission(processor.discoveryDB, user2.userId, 'tippers')

    // New blast from user 1 now should not be sent to user 2 as user 1 has not tipped user 2
    const message2 = 'please let me DM you'
    const blastId2 = '2'
    const messageTimestampMs2 = Date.now() - config.dmNotificationDelay
    const messageTimestamp2 = new Date(messageTimestampMs2)
    await insertBlast(
      processor.discoveryDB,
      user1.userId,
      blastId2,
      message2,
      audience,
      undefined,
      undefined,
      messageTimestamp2
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // No new notifications
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(2)
  }, 40000)

  test('Test many blasts ', async () => {
    config.blastUserBatchSize = 2
    const numUsers = 5
    const numInitialFollowers = numUsers - 2
    const users = await setupNUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB,
      numUsers
    )

    // User 0 is the blast sender. All other users follow user 0
    // except user 2 (leave a gap)
    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 1, followee_user_id: 0 },
      { follower_user_id: 3, followee_user_id: 0 },
      { follower_user_id: 4, followee_user_id: 0 }
    ])

    processor.start()
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // Follow notifs
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(numInitialFollowers)

    let blastId = '0'
    let blastTimestampMs = Date.now() - config.dmNotificationDelay
    let blastTimestamp = new Date(blastTimestampMs)
    const audience = 'follower_audience'
    let message = 'hi from user 0'
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

    await new Promise((r) =>
      setTimeout(r, config.pollInterval * (numUsers - 1))
    )

    let notifsSoFar = numInitialFollowers * 2
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(notifsSoFar)
    for (let i = 0; i < numInitialFollowers; i++) {
      expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
        notifsSoFar - i,
        expect.objectContaining({
          type: users[0].deviceType
        }),
        expect.objectContaining({
          title: 'Message',
          body: `New message from ${users[0].name}`,
          data: expect.objectContaining({
            type: 'Message'
          })
        })
      )
    }

    // Test race condition when new follower whose userId is in the middle of a batch
    // is added in between processing a blast
    blastId = '1'
    blastTimestampMs = Date.now() - config.dmNotificationDelay
    blastTimestamp = new Date(blastTimestampMs)
    message = 'second blast from user 0'
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
    await new Promise((r) => setTimeout(r, config.pollInterval))

    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 2, followee_user_id: 0 }
    ])

    await new Promise((r) =>
      setTimeout(r, config.pollInterval * (numUsers - 1))
    )

    // Expect 3 more blast notifs + 1 follow notif
    notifsSoFar = numInitialFollowers * 3 + 1
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(notifsSoFar)
    expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
      notifsSoFar,
      expect.objectContaining({
        type: users[0].deviceType
      }),
      expect.objectContaining({
        title: 'Message',
        body: `New message from ${users[0].name}`,
        data: expect.objectContaining({
          type: 'Message'
        })
      })
    )

    const numFinalFollowers = numUsers - 1
    blastId = '2'
    blastTimestampMs = Date.now() - config.dmNotificationDelay
    blastTimestamp = new Date(blastTimestampMs)
    message = 'third blast from user 0'
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

    await new Promise((r) =>
      setTimeout(r, config.pollInterval * (numUsers - 1))
    )

    // Expect all users to receive a blast notif now
    notifsSoFar = notifsSoFar + numFinalFollowers
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(notifsSoFar)
    for (let i = 0; i < numFinalFollowers; i++) {
      expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
        notifsSoFar - i,
        expect.objectContaining({
          type: users[0].deviceType
        }),
        expect.objectContaining({
          title: 'Message',
          body: `New message from ${users[0].name}`,
          data: expect.objectContaining({
            type: 'Message'
          })
        })
      )
    }
  }, 40000)

  // Clients may not allow blasts to be sent with audience size 0, but technically
  // this is not restricted at the protocol layer. This test is to ensure that the processor
  // correctly skips over such blasts and doesn't stall.
  test('Test blast with audience size 0', async () => {
    config.blastUserBatchSize = 2
    const { user1, user2 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // User 0 is the blast sender. All other users follow user 0 except user 3
    await insertFollows(processor.discoveryDB, [
      { follower_user_id: user2.userId, followee_user_id: user1.userId }
    ])

    processor.start()
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // Follow notif
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)

    // First blast sent by user2 who has no followers, so audience size 0
    let blastId = '0'
    let blastTimestampMs = Date.now() - config.dmNotificationDelay
    let blastTimestamp = new Date(blastTimestampMs)
    const audience = 'follower_audience'
    let message = 'this blast should not reach anyone'
    await insertBlast(
      processor.discoveryDB,
      user2.userId,
      blastId,
      message,
      audience,
      undefined,
      undefined,
      blastTimestamp
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // No new notifs
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)

    blastId = '1'
    blastTimestampMs = Date.now() - config.dmNotificationDelay
    blastTimestamp = new Date(blastTimestampMs)
    message = 'this blast should reach 1 follower'
    await insertBlast(
      processor.discoveryDB,
      user1.userId,
      blastId,
      message,
      audience,
      undefined,
      undefined,
      blastTimestamp
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // Now expect to see follow notif + 1 blast notif
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(2)
    expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
      2,
      { badgeCount: 1, targetARN: user2.awsARN, type: user2.deviceType },
      {
        title: 'Message',
        body: `New message from ${user1.name}`,
        data: expect.objectContaining({
          chatId: '7eP5n:ML51L',
          type: 'Message'
        })
      }
    )
  })

  test('Does not send DM notifications when sender is receiver', async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // Start processor
    processor.start()
    // Let notifications job run for a few cycles to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // User 1 sent message config.dmNotificationDelay ms ago
    const message = 'hi from user 1'
    const messageId = '1'
    const messageTimestampMs = Date.now() - config.dmNotificationDelay
    const messageTimestamp = new Date(messageTimestampMs)
    const chatId = '1'
    await createChat(
      processor.discoveryDB,
      user1.userId,
      user2.userId,
      chatId,
      messageTimestamp
    )
    await insertMessage(
      processor.discoveryDB,
      user1.userId,
      chatId,
      messageId,
      message,
      messageTimestamp
    )

    // expanded timeout because timeout was faster than delay
    // see 'Does not send DM reaction notifications created fewer than delay minutes ago' test for why
    // the spy might not have been called
    await new Promise((r) => setTimeout(r, config.pollInterval * 5))
    expect(sendPushNotificationSpy).toHaveBeenCalledTimes(1)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: user2.deviceType,
        targetARN: user2.awsARN,
        badgeCount: 1
      },
      {
        title: 'Message',
        body: `New message from ${user1.name}`,
        data: {
          type: 'Message',
          chatId
        }
      }
    )

    jest.clearAllMocks()

    // User 1 reacted to user 1's message config.dmNotificationDelay ms ago
    const reaction = '🔥'
    const reactionTimestampMs = Date.now() - config.dmNotificationDelay
    await insertReaction(
      processor.discoveryDB,
      user1.userId,
      messageId,
      reaction,
      new Date(reactionTimestampMs)
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled()
  }, 40000)

  test('Does not send DM notifications created fewer than delay minutes ago', async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // Start processor
    processor.start()
    // Let notifications job run for a few cycles to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // User 1 sends message now
    const message = 'hi from user 1'
    const messageId = '1'
    const messageTimestamp = new Date(Date.now())
    const chatId = '1'
    await createChat(
      processor.discoveryDB,
      user1.userId,
      user2.userId,
      chatId,
      messageTimestamp
    )
    await insertMessage(
      processor.discoveryDB,
      user1.userId,
      chatId,
      messageId,
      message,
      messageTimestamp
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled
  })

  test('Does not send DM reaction notifications created fewer than delay minutes ago', async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // Set up chat and message
    const message = 'hi from user 1'
    const messageId = '1'
    const messageTimestamp = new Date(Date.now())
    const chatId = '1'
    await createChat(
      processor.discoveryDB,
      user1.userId,
      user2.userId,
      chatId,
      messageTimestamp
    )
    await insertMessage(
      processor.discoveryDB,
      user1.userId,
      chatId,
      messageId,
      message,
      messageTimestamp
    )

    // Start processor
    processor.start()
    // Let notifications job run for a few cycles to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // User 2 reacts to user 1's message now
    const reaction = '🔥'
    await insertReaction(
      processor.discoveryDB,
      user2.userId,
      messageId,
      reaction,
      new Date(Date.now())
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled
  })

  test('Does not send DM notifications for messages that have been read', async () => {
    const { user1, user2 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // Start processor
    processor.start()
    // Let notifications job run for a few cycles to initialize the min cursors in redis
    await new Promise((r) => setTimeout(r, config.pollInterval * 2))

    // User 1 sent message config.dmNotificationDelay ms ago
    const message = 'hi from user 1'
    const messageId = '1'
    const messageTimestampMs = Date.now() - config.dmNotificationDelay
    const messageTimestamp = new Date(messageTimestampMs)
    const chatId = '1'
    await createChat(
      processor.discoveryDB,
      user1.userId,
      user2.userId,
      chatId,
      messageTimestamp
    )
    await insertMessage(
      processor.discoveryDB,
      user1.userId,
      chatId,
      messageId,
      message,
      messageTimestamp
    )
    // User 2 reads chat
    await readChat(
      processor.discoveryDB,
      user2.userId,
      chatId,
      new Date(Date.now())
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled

    jest.clearAllMocks()

    // User 2 reacted to user 1's message config.dmNotificationDelay ms ago
    const reaction = '🔥'
    const reactionTimestampMs = Date.now() - config.dmNotificationDelay
    await insertReaction(
      processor.discoveryDB,
      user2.userId,
      messageId,
      reaction,
      new Date(reactionTimestampMs)
    )

    // User 1 reads chat
    await readChat(
      processor.discoveryDB,
      user1.userId,
      chatId,
      new Date(Date.now())
    )

    await new Promise((r) => setTimeout(r, config.pollInterval * 2))
    expect(sendPushNotificationSpy).not.toHaveBeenCalled
  })
})
