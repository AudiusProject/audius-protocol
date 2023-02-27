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
  createTracks,
  createPlaylists,
  createSubscription,
} from '../../utils/populateDB'

describe('Create Notification', () => {
  let processor: Processor

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

  test("Process push notification for create track", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [{ subscriber_id: 2, user_id: 1 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
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
      title: 'New Artist Update',
      body: `user_1 released a new track`,
      data: {}
    })
  })

  test("Process push notification for create playlist", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [{ subscriber_id: 2, user_id: 1 }])
    await createPlaylists(processor.discoveryDB, [{ playlist_id: 10, playlist_owner_id: 1, playlist_name: 'I am a playlist' }])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
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
      title: 'New Artist Update',
      body: 'user_1 released a new playlist I am a playlist',
      data: {}
    })
  })

  test("Process push notification for create album", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [{ subscriber_id: 2, user_id: 1 }])
    await createPlaylists(processor.discoveryDB, [{ playlist_id: 10, playlist_owner_id: 1, playlist_name: 'I am an album', is_album: true }])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
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
      title: 'New Artist Update',
      body: 'user_1 released a new album I am an album',
      data: {}
    })
  })

})
