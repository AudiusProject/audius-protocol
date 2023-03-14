import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import { AppEmailNotification } from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTestDB,
  dropTestDB,
  replaceDBName,
  insertNotifications,
  createTracks
} from '../../utils/populateDB'

describe('Trending Track Notification', () => {
  let processor: Processor
  // Mock current date for test result consistency
  Date.now = jest.fn(() => new Date("2020-05-13T12:33:37.000Z").getTime())


  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  beforeEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      createTestDB(process.env.DN_DB_URL, testName),
      createTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
    processor = new Processor()
    await processor.init({
      identityDBUrl: replaceDBName(process.env.IDENTITY_DB_URL, testName),
      discoveryDBUrl: replaceDBName(process.env.DN_DB_URL, testName),
    })
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await processor?.close()
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      dropTestDB(process.env.DN_DB_URL, testName),
      dropTestDB(process.env.IDENTITY_DB_URL, testName),
    ])
  })


  test("Process push notification for trending track", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])

    // User 1 follows user 2
    const notificationRow = {
      id: 1,
      specifier: '10',
      group_id: 'trending:time_range:week:genre:all:rank:3:track_id:10:timestamp:1677261600',
      type: 'trending',
      timestamp: new Date(),
      data: { "rank": 3, "genre": "all", "track_id": 10, "time_range": "week" },
      user_ids: [1]
    }
    await insertNotifications(processor.discoveryDB, [notificationRow])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const dethronedNotifications = pending.appNotifications.filter(n => n.type === 'trending')
    expect(dethronedNotifications).toHaveLength(1)

    // Assert single pending
    await processor.appNotificationsProcessor.process(dethronedNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 1
    }, {
      title: 'Congrats - You’re Trending! 📈',
      body: `Your Track track_title_10 is 3rd on Trending Right Now! 🍾`,
      data: {}
    })
  })


  test("Render a single email", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])

    await new Promise(resolve => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        timestamp: new Date(),
        specifier: '10',
        group_id: 'trending:time_range:week:genre:all:rank:3:track_id:10:timestamp:1677261600',
        type: 'trending',
        data: { "rank": 3, "genre": "all", "track_id": 10, "time_range": "week" },
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
