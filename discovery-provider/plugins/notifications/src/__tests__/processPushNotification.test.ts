import { expect, jest, test } from '@jest/globals';
import { Processor } from '../main';
import * as sns from '../sns'

import { createTestDB, createUsers, dropTestDB, insertFollows, insertMobileDevices, insertMobileSettings, replaceDBName } from '../utils/populateDB';

describe.skip('Push Notifications', () => {

  beforeEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      createTestDB(process.env.DN_DB_URL, testName),
      createTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
  })

  afterEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      dropTestDB(process.env.DN_DB_URL, testName),
      dropTestDB(process.env.IDENTITY_DB_URL, testName),
    ])
  })

  test("Process follow for ios", async () => {
    let processor: Processor
    try {
      const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
        .mockImplementation(() => Promise.resolve())

      console.log('start processor')
      processor = new Processor()
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      await processor.init({
        identityDBUrl: replaceDBName(process.env.IDENTITY_DB_URL, testName),
        discoveryDBUrl: replaceDBName(process.env.DN_DB_URL, testName),
      })
      console.log('inserting')
      await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
      await insertFollows(processor.discoveryDB, [{ follower_user_id: 1, followee_user_id: 2 }])
      await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
      await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
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
        title: 'Follow',
        body: 'user_1 followed you',
        data: {}
      })

      await processor.listener.close()
    } finally {
      await processor?.listener?.close()
      await processor?.discoveryDB?.destroy()
      await processor?.identityDB?.destroy()
    }
  })
})
