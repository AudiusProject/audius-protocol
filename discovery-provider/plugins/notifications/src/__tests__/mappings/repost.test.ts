import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import { getRedisConnection } from './../../utils/redisConnection'
import { config } from './../../config'

import {
  createUsers,
  insertFollows,
  insertMobileDevices,
  insertMobileSettings,
  createTestDB,
  dropTestDB,
  replaceDBName,
  createReposts,
  createTracks,
  createPlaylists
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { reposttype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Repost Notification', () => {
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

  test("Process push notification for repost track", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createReposts(processor.discoveryDB, [{
      user_id: 2, repost_item_id: 10, repost_type: reposttype.track
    }])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'New Repost',
      body: 'user_2 reposted your track track_title_10',
      data: {}
    })
  })

  test("Process push notification for repost playlist", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [{ playlist_id: 20, playlist_owner_id: 1, is_album: false }])
    await createReposts(processor.discoveryDB, [{
      user_id: 2, repost_item_id: 20, repost_type: reposttype.playlist
    }])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'New Repost',
      body: 'user_2 reposted your playlist playlist_name_20',
      data: {}
    })
  })

  test("Process push notification for repost album", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [{ playlist_id: 30, playlist_owner_id: 1, is_album: true }])
    await createReposts(processor.discoveryDB, [{
      user_id: 2, repost_item_id: 30, repost_type: reposttype.playlist
    }])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'New Repost',
      body: 'user_2 reposted your album playlist_name_30',
      data: {}
    })
  })

  test("Render a single email", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createReposts(processor.discoveryDB, [{
      user_id: 2, repost_item_id: 10, repost_type: reposttype.track
    }])

    await new Promise(resolve => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        type: 'repost',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'repost:10:type:track',
        data: {
          type: EntityType.Track,
          user_id: 2,
          repost_item_id: 10
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

})
