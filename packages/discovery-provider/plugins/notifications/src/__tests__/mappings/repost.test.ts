import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import * as sendEmailFns from '../../email/notifications/sendEmail'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createReposts,
  createTracks,
  createPlaylists,
  setupTest,
  resetTests,
  setUserEmailAndSettings
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { reposttype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Repost Notification', () => {
  let processor: Processor

  // Mock current date for test result consistency
  Date.now = jest.fn(() => new Date('2020-05-13T12:33:37.000Z').getTime())

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  const sendEmailNotificationSpy = jest
    .spyOn(sendEmailFns, 'sendNotificationEmail')
    .mockImplementation(() => Promise.resolve(true))

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('live emails should not send for daily setting on user', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 10,
        repost_type: reposttype.track
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await setUserEmailAndSettings(processor.identityDB, 'daily', 1)
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    expect(sendEmailNotificationSpy).not.toHaveBeenCalled()
  })

  test('Process push notification for repost track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 10,
        repost_type: reposttype.track
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await setUserEmailAndSettings(processor.identityDB, 'live', 1)

    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'New Repost',
        body: 'user_2 reposted your track track_title_10',
        data: {
          id: 'timestamp:1589373217:group_id:repost:10:type:track',
          type: 'Repost',
          userIds: [2]
        }
      }
    )

    expect(sendEmailNotificationSpy).toHaveBeenCalledWith({
      userId: 1,
      email: 'user_1@gmail.com',
      frequency: 'live',
      notifications: [
        expect.objectContaining({
          specifier: '2',
          group_id: 'repost:10:type:track'
        })
      ],
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
  })

  test('Process push notification for repost playlist', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [
      { playlist_id: 20, playlist_owner_id: 1, is_album: false }
    ])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 20,
        repost_type: reposttype.playlist
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'New Repost',
        body: 'user_2 reposted your playlist playlist_name_20',
        data: {
          id: 'timestamp:1589373217:group_id:repost:20:type:playlist',
          type: 'Repost',
          userIds: [2]
        }
      }
    )
  })

  test('Process push notification for repost album', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [
      { playlist_id: 30, playlist_owner_id: 1, is_album: true }
    ])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 30,
        repost_type: reposttype.playlist
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'New Repost',
        body: 'user_2 reposted your album playlist_name_30',
        data: {
          id: 'timestamp:1589373217:group_id:repost:30:type:playlist',
          type: 'Repost',
          userIds: [2]
        }
      }
    )
  })

  test('Render a single email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 10,
        repost_type: reposttype.track
      }
    ])

    await new Promise((resolve) => setTimeout(resolve, 10))

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

  test('Render a multi repost email', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 },
      { user_id: 4 },
      { user_id: 5 }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])

    await createReposts(processor.discoveryDB, [
      { user_id: 2, repost_item_id: 10, repost_type: reposttype.track },
      { user_id: 3, repost_item_id: 10, repost_type: reposttype.track },
      { user_id: 4, repost_item_id: 10, repost_type: reposttype.track },
      { user_id: 5, repost_item_id: 10, repost_type: reposttype.track }
    ])

    const notifications: AppEmailNotification[] = Array.from(
      new Array(4),
      (_, num) => ({
        type: 'repost',
        timestamp: new Date(),
        specifier: (num + 2).toString(),
        group_id: 'repost:10:type:track',
        data: {
          type: EntityType.Track,
          user_id: num + 2,
          repost_item_id: 10
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
