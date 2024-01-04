import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTracks,
  createPlaylists,
  createSaves,
  setupTest,
  resetTests
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { savetype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Save Notification', () => {
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

  test('Process push notification for save track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createSaves(processor.discoveryDB, [
      {
        user_id: 2,
        save_item_id: 10,
        save_type: savetype.track
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
        title: 'New Favorite',
        body: 'user_2 favorited your track track_title_10',
        data: {
          id: 'timestamp:1589373217:group_id:save:10:type:track',
          type: 'Favorite',
          userIds: [2]
        }
      }
    )
  })

  test('Process push notification for save playlist', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [
      { playlist_id: 20, playlist_owner_id: 1, is_album: false }
    ])
    await createSaves(processor.discoveryDB, [
      {
        user_id: 2,
        save_item_id: 20,
        save_type: savetype.playlist
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
        title: 'New Favorite',
        body: 'user_2 favorited your playlist playlist_name_20',
        data: {
          id: 'timestamp:1589373217:group_id:save:20:type:playlist',
          type: 'Favorite',
          userIds: [2]
        }
      }
    )
  })

  test('Process push notification for save album', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [
      { playlist_id: 30, playlist_owner_id: 1, is_album: true }
    ])
    await createSaves(processor.discoveryDB, [
      {
        user_id: 2,
        save_item_id: 30,
        save_type: savetype.playlist
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
        title: 'New Favorite',
        body: 'user_2 favorited your album playlist_name_30',
        data: {
          id: 'timestamp:1589373217:group_id:save:30:type:playlist',
          type: 'Favorite',
          userIds: [2]
        }
      }
    )
  })

  test('Render a single email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createSaves(processor.discoveryDB, [
      {
        user_id: 2,
        save_item_id: 10,
        save_type: savetype.track
      }
    ])

    await new Promise((resolve) => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        type: 'save',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'save:10:type:track',
        data: {
          type: EntityType.Track,
          user_id: 2,
          save_item_id: 10
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

  test('Render a multi save email', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 },
      { user_id: 4 },
      { user_id: 5 }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])

    await createSaves(processor.discoveryDB, [
      { user_id: 2, save_item_id: 10, save_type: savetype.track },
      { user_id: 3, save_item_id: 10, save_type: savetype.track },
      { user_id: 4, save_item_id: 10, save_type: savetype.track },
      { user_id: 5, save_item_id: 10, save_type: savetype.track }
    ])

    const notifications: AppEmailNotification[] = Array.from(
      new Array(4),
      (_, num) => ({
        type: 'save',
        timestamp: new Date(),
        specifier: (num + 2).toString(),
        group_id: 'save:10:type:track',
        data: {
          type: EntityType.Track,
          user_id: num + 2,
          save_item_id: 10
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
