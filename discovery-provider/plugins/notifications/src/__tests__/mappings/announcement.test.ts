import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import { getRedisConnection } from './../../utils/redisConnection'
import { config } from './../../config'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTestDB,
  dropTestDB,
  replaceDBName,
  insertNotifications,
} from '../../utils/populateDB'
import { AnnouncementNotification, AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'

describe('Announcement Notification', () => {
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
    const redis = await getRedisConnection()
    redis.del(config.lastIndexedMessageRedisKey)
    redis.del(config.lastIndexedReactionRedisKey)
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

  test("Process push notification for announcement", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }])

    await insertNotifications(processor.discoveryDB, [{
      specifier: "",
      group_id: "announcement:blocknumber:1",
      type: "announcement",
      blocknumber: 2,
      timestamp: new Date(),
      data: {
        title: "This is an announcement",
        short_description: 'This is some information about the announcement we need to display'
      },
      user_ids: [1, 2],
    }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:2',
      badgeCount: 0
    }, {
      title: "This is an announcement",
      body: 'This is some information about the announcement we need to display',
      data: {}
    })
  })

  test("Render a single announcement email", async () => {
    const data: AnnouncementNotification = {
      title: "This is an announcement",
      short_description: 'This is some information about the announcement we need to display'
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'announcement',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'announcement:blocknumber:1',
        data,
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
