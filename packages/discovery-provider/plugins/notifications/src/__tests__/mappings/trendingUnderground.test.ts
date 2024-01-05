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

describe('Trending Underground Notification', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2020-05-13T12:33:37.000Z'))
    const setup = await setupTest({ mockTime: false })
    processor = setup.processor

    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for trending underground track', async () => {
    await insertNotifications(processor.discoveryDB, [
      {
        id: 1,
        specifier: '10',
        group_id:
          'trending_underground:time_range:week:genre:all:rank:3:track_id:10:timestamp:1677261600',
        type: 'trending_underground',
        timestamp: new Date(),
        data: { rank: 3, genre: 'all', track_id: 10, time_range: 'week' },
        user_ids: [1]
      }
    ])

    await insertMobileSettings(processor.identityDB, [
      { userId: 1 },
      { userId: 2 }
    ])
    await insertMobileDevices(processor.identityDB, [
      { userId: 1 },
      { userId: 2 }
    ])
    const pending = processor.listener.takePending()
    const undergroundNotifications = pending.appNotifications.filter(
      (n) => n.type === 'trending_underground'
    )

    expect(undergroundNotifications).toHaveLength(1)

    await processor.appNotificationsProcessor.process(undergroundNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: "📈 You're Trending",
        body: `track_title_10 is #3 on Underground Trending right now!`,
        data: {}
      }
    )
  })

  test('Render a single email', async () => {
    const notifications: AppEmailNotification[] = [
      {
        timestamp: new Date(),
        specifier: '10',
        group_id:
          'trending_underground:time_range:week:genre:all:rank:3:track_id:10:timestamp:1677261600',
        type: 'trending_underground',
        data: { rank: 3, genre: 'all', track_id: 10, time_range: 'week' },
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
})
