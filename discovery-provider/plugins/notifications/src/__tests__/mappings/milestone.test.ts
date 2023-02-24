import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import { getRedisConnection } from '../../utils/redisConnection'
import { config } from '../../config'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTestDB,
  dropTestDB,
  replaceDBName,
  createTracks,
  createPlaylists,
  createSaves,
  insertFollows,
  createReposts,
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'
import { reposttype, savetype } from '../../types/dn'

describe('Milestone Notification', () => {
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

  test("Process push notification for follow count milestone", async () => {
    await createUsers(processor.discoveryDB, new Array(13).fill(null).map((_, ind) => ({ user_id: ind + 1 })))
    console.log('stating')
    await insertFollows(processor.discoveryDB, new Array(10).fill(null).map((_, ind) => ({ followee_user_id: 1, follower_user_id: ind + 2 })))

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    const milestoneNotifications = pending.appNotifications.filter(n => n.type === 'milestone' || n.type === 'milestone_follower_count')
    expect(milestoneNotifications).toHaveLength(1)
    // Assert single pending

    console.log(milestoneNotifications)
    await processor.appNotificationsProcessor.process(milestoneNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'Congratulations! 🎉',
      body: "You have reached over 10 Followers",
      data: {}
    })
  })

  test("Process push notification for track repost milestone", async () => {
    await createUsers(processor.discoveryDB, new Array(13).fill(null).map((_, ind) => ({ user_id: ind + 1 })))
    console.log('stating')
    await createTracks(processor.discoveryDB, [{ track_id: 2, owner_id: 1 }])
    await createReposts(processor.discoveryDB,
      new Array(10).fill(null).map((_, ind) => ({ repost_type: reposttype.track, repost_item_id: 2, user_id: ind + 2 })))

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    const milestoneNotifications = pending.appNotifications.filter(n => n.type === 'milestone')
    expect(milestoneNotifications).toHaveLength(1)
    // Assert single pending

    console.log(milestoneNotifications)
    await processor.appNotificationsProcessor.process(milestoneNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'Congratulations! 🎉',
      body: "Your track track_title_2 has reached over 10 reposts",
      data: {}
    })
  })

  test("Process push notification for playlist repost milestone", async () => {
    await createUsers(processor.discoveryDB, new Array(13).fill(null).map((_, ind) => ({ user_id: ind + 1 })))
    console.log('stating')
    await createPlaylists(processor.discoveryDB, [{ playlist_id: 32, playlist_owner_id: 1 }])
    await createReposts(processor.discoveryDB,
      new Array(10).fill(null).map((_, ind) => ({ repost_type: reposttype.playlist, repost_item_id: 32, user_id: ind + 2 })))

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    const milestoneNotifications = pending.appNotifications.filter(n => n.type === 'milestone')
    expect(milestoneNotifications).toHaveLength(1)
    // Assert single pending

    console.log(milestoneNotifications)
    await processor.appNotificationsProcessor.process(milestoneNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'Congratulations! 🎉',
      body: "Your playlist playlist_name_32 has reached over 10 reposts",
      data: {}
    })
  })

  test("Process push notification for track save milestone", async () => {
    await createUsers(processor.discoveryDB, new Array(13).fill(null).map((_, ind) => ({ user_id: ind + 1 })))
    console.log('stating')
    await createTracks(processor.discoveryDB, [{ track_id: 2, owner_id: 1 }])
    await createSaves(processor.discoveryDB,
      new Array(10).fill(null).map((_, ind) => ({ save_type: savetype.track, save_item_id: 2, user_id: ind + 2 })))

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    const milestoneNotifications = pending.appNotifications.filter(n => n.type === 'milestone')
    expect(milestoneNotifications).toHaveLength(1)
    // Assert single pending

    console.log(milestoneNotifications)
    await processor.appNotificationsProcessor.process(milestoneNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'Congratulations! 🎉',
      body: "Your track track_title_2 has reached over 10 favorites",
      data: {}
    })
  })

  test("Process push notification for playlist save milestone", async () => {
    await createUsers(processor.discoveryDB, new Array(13).fill(null).map((_, ind) => ({ user_id: ind + 1 })))
    console.log('stating')
    await createPlaylists(processor.discoveryDB, [{ playlist_id: 32, playlist_owner_id: 1 }])
    await createSaves(processor.discoveryDB,
      new Array(10).fill(null).map((_, ind) => ({ save_type: savetype.playlist, save_item_id: 32, user_id: ind + 2 })))

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    const milestoneNotifications = pending.appNotifications.filter(n => n.type === 'milestone')
    expect(milestoneNotifications).toHaveLength(1)
    // Assert single pending

    console.log(milestoneNotifications)
    await processor.appNotificationsProcessor.process(milestoneNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: 'Congratulations! 🎉',
      body: "Your playlist playlist_name_32 has reached over 10 favorites",
      data: {}
    })
  })

})
