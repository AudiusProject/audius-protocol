import { expect, jest, test } from '@jest/globals'
import { Knex } from 'knex'
import { Processor } from '../../main'
import * as sns from '../../sns'
import { getRedisConnection } from './../../utils/redisConnection'
import { config } from './../../config'
import { getDB } from '../../conn'
import * as sendEmail from '../../email/notifications/sendEmail'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTestDB,
  dropTestDB,
  replaceDBName,
  createTracks,
  createBlocks,
  createReposts,
} from '../../utils/populateDB'
import { reposttype } from '../../types/dn'

describe('Cosign Notification', () => {
  let processor: Processor

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

  test("Process push notification for cosign remixed track", async () => {

    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])

    await createBlocks(processor.discoveryDB, [{ number: 1 }])

    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createTracks(processor.discoveryDB, [{
      track_id: 20,
      owner_id: 2,
      blocknumber: 1,
      remix_of: { 'tracks': [{ 'parent_track_id': 10 }] }
    }])
    await createReposts(processor.discoveryDB, [{
      user_id: 1, repost_item_id: 20, repost_type: reposttype.track
    }])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const cosignNotifications = pending.appNotifications.filter(n => n.type === 'cosign')
    expect(cosignNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(cosignNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'New Track Co-Sign! 🔥',
      body: "user_1 Co-Signed your Remix of track_title_20",
      data: {}
    })
  })

})
