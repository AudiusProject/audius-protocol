import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import {
  setupTest,
  setupTwoUsersWithDevices,
  insertNotifications,
  resetTests,
  createTracks
} from '../../utils/populateDB'

describe('Fan Remix Contest Ended Notification', () => {
  let processor: Processor
  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Sends push notification for fan_remix_contest_ended', async () => {
    const { user1 } = await setupTwoUsersWithDevices(
      processor.discoveryDB,
      processor.identityDB
    )

    // Insert artist user for entityUserId 99
    await processor.discoveryDB('users').insert({
      user_id: 99,
      name: 'user_99',
      is_current: true,
      created_at: new Date(),
      updated_at: new Date()
    })

    // Create track with cover art
    await createTracks(processor.discoveryDB, [
      { track_id: 12345, owner_id: 99, cover_art_sizes: 'test-hash' }
    ])

    await insertNotifications(processor.discoveryDB, [
      {
        type: 'fan_remix_contest_ended',
        user_ids: [user1.userId],
        group_id: 'test-group',
        specifier: 'test-specifier',
        timestamp: new Date(),
        data: { entityId: 12345, entityUserId: 99 }
      }
    ])

    // Wait a short time for the notification to be enqueued
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    expect(pending?.appNotifications).toBeDefined()
    expect(pending.appNotifications).toHaveLength(1)

    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: user1.deviceType,
        targetARN: user1.awsARN,
        badgeCount: 1
      }),
      expect.objectContaining({
        title: 'Remix Contest',
        body: "user_99's remix contest has closed and winners will be announced soon. Good luck!",
        data: expect.objectContaining({
          type: 'FanRemixContestEnded',
          entityId: 12345,
          entityUserId: 99
        }),
        imageUrl: 'https://creatornode2.audius.co/content/test-hash/150x150.jpg'
      })
    )
  })
})
