import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import { AppEmailNotification } from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  insertNotifications,
  createTracks,
  setupTest,
  resetTests
} from '../../utils/populateDB'

describe('Tastemaker Notification', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2020-05-13T12:33:37.000Z'))
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for trending track', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 3, owner_id: 2 }])

    // User 1 follows user 2
    const notificationRow = {
      id: 1,
      specifier: '10',
      group_id: 'tastemaker_user_id:10:tastemaker_item_id:3',
      type: 'tastemaker',
      timestamp: new Date(),
      data: {
        tastemaker_item_id: 3,
        tastemaker_item_type: 'track',
        tastemaker_item_owner_id: 2,
        action: 'repost',
        tastemaker_user_id: 10
      },
      user_ids: [10]
    }
    await insertNotifications(processor.discoveryDB, [notificationRow])

    await insertMobileSettings(processor.identityDB, [{ userId: 10 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 10 }])
    // await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending).not.toBe(undefined)
    const tastemaker_notifications = pending.appNotifications.filter(
      (n) => n.type === 'tastemaker'
    )
    expect(tastemaker_notifications).toHaveLength(1)

    // Assert single pending
    await processor.appNotificationsProcessor.process(tastemaker_notifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:10',
        badgeCount: 1
      },
      {
        title: `You're a Tastemaker!`,
        body: `track_title_3 is now trending thanks to you! Great work 🙌🏽`,
        data: {
          id: 'timestamp:1589373217:group_id:tastemaker_user_id:10:tastemaker_item_id:3',
          type: 'Tastemaker',
          userIds: [10],
          entityType: 'Track',
          entityId: 3
        }
      }
    )
  })

  test('Render a single email', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 },
      { user_id: 10 }
    ])
    await createTracks(processor.discoveryDB, [
      { track_id: 3, title: 'my track', owner_id: 2 }
    ])

    // await new Promise((resolve) => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        id: 1,
        specifier: '10',
        group_id: 'tastemaker_user_id:10:tastemaker_item_id:3',
        type: 'tastemaker',
        timestamp: new Date(),
        data: {
          tastemaker_item_id: 3,
          tastemaker_item_type: 'track',
          tastemaker_item_owner_id: 2,
          action: 'repost',
          tastemaker_user_id: 10
        },
        user_ids: [10],
        receiver_user_id: 10
      }
    ]
    const notifHtml = await renderEmail({
      userId: 1,
      email: 'joey@audius.co',
      frequency: 'daily',
      notifications,
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(notifHtml).toMatchSnapshot()
  })
})
