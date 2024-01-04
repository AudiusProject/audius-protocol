import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertFollows,
  insertMobileDevices,
  insertMobileSettings,
  setupTest,
  resetTests
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'

describe('Follow Notification', () => {
  let processor: Processor

  // Mock current date for test result consistency
  Date.now = jest.fn(() => new Date('2020-05-13T12:33:37.000Z').getTime())

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

  test('Process follow push notification', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 1, followee_user_id: 2 }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: 'New Follow',
        body: 'user_1 followed you',
        data: {
          id: 'timestamp:1589373217:group_id:follow:2',
          type: 'Follow',
          userIds: [1]
        }
      }
    )
  })

  test('Render a single Follow email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])

    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 2, followee_user_id: 1 }
    ])

    const notifications: AppEmailNotification[] = [
      {
        type: 'follow',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'follow:1',
        data: {
          follower_user_id: 2,
          followee_user_id: 1
        },
        user_ids: [1],
        receiver_user_id: 1
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

  test('Render a multi Follow email', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 },
      { user_id: 4 },
      { user_id: 5 }
    ])

    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 2, followee_user_id: 1 },
      { follower_user_id: 3, followee_user_id: 1 },
      { follower_user_id: 4, followee_user_id: 1 },
      { follower_user_id: 5, followee_user_id: 1 }
    ])

    const notifications: AppEmailNotification[] = Array.from(
      new Array(4),
      (_, num) => ({
        type: 'follow',
        timestamp: new Date(),
        specifier: (num + 2).toString(),
        group_id: 'follow:1',
        data: {
          follower_user_id: num + 2,
          followee_user_id: 1
        },
        user_ids: [1],
        receiver_user_id: 1
      })
    )

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
