import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTracks,
  createPlaylists,
  createSubscription,
  setupTest,
  resetTests
} from '../../utils/populateDB'
import { renderEmail } from '../../email/notifications/renderEmail'
import {
  AppEmailNotification,
  CreatePlaylistNotification,
  CreateTrackNotification
} from '../../types/notifications'

describe('Create Notification', () => {
  let processor: Processor

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

  test('Process push notification for create track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [
      { subscriber_id: 2, user_id: 1 }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])

    await insertMobileSettings(processor.identityDB, [
      { userId: 1 },
      { userId: 2 }
    ])
    await insertMobileDevices(processor.identityDB, [
      { userId: 1 },
      { userId: 2 }
    ])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    // Assert single pending
    expect(pending?.appNotifications).toHaveLength(1)

    // Enable all the notifications
    processor.appNotificationsProcessor.getIsPushNotificationEnabled = () =>
      true
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: 'New Artist Update',
        body: `user_1 released a new track`,
        data: {
          id: 'timestamp:1589373217:group_id:create:track:user_id:1',
          type: 'UserSubscription',
          entityIds: [10],
          userId: 1,
          entityType: 'Track'
        }
      }
    )
  })

  test('Process push notification for create usdc purchase track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [
      { subscriber_id: 2, user_id: 1 }
    ])
    await createTracks(processor.discoveryDB, [
      {
        track_id: 10,
        owner_id: 1,
        stream_conditions: {
          usdc_purchase: {
            price: 100,
            splits: {
              '8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj': 1000000
            }
          }
        }
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
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    // Assert single pending
    expect(pending?.appNotifications).toHaveLength(1)

    processor.appNotificationsProcessor.getIsPushNotificationEnabled = (
      type: string
    ) => (type === 'usdc_purchase_seller' ? false : true)
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).not.toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: 'New Artist Update',
        body: `user_1 released a new track`,
        data: {
          id: 'timestamp:1589373217:group_id:create:track:user_id:1',
          type: 'UserSubscription',
          entityIds: [10],
          userId: 1,
          entityType: 'Track'
        }
      }
    )

    // Enable all the notifications
    processor.appNotificationsProcessor.getIsPushNotificationEnabled = () =>
      true
    await processor.appNotificationsProcessor.reprocess()
    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: 'New Artist Update',
        body: `user_1 released a new track`,
        data: {
          id: 'timestamp:1589373217:group_id:create:track:user_id:1',
          type: 'UserSubscription',
          entityIds: [10],
          userId: 1,
          entityType: 'Track'
        }
      }
    )
  })

  test('Process email notification for create tracks', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [
      { subscriber_id: 2, user_id: 1 }
    ])
    await createTracks(processor.discoveryDB, [
      { track_id: 10, owner_id: 1 },
      { track_id: 11, owner_id: 1 }
    ])
    const data: CreateTrackNotification = {
      track_id: 10
    }
    const data2: CreateTrackNotification = {
      track_id: 11
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'create',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'create:track:user_id:1',
        data,
        user_ids: [2],
        receiver_user_id: 2
      },
      {
        type: 'create',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'create:track:user_id:1',
        data: data2,
        user_ids: [2],
        receiver_user_id: 2
      }
    ]

    const notifHtml = await renderEmail({
      userId: 2,
      email: 'joey@audius.co',
      frequency: 'daily',
      notifications,
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })

    expect(notifHtml).toMatchSnapshot()
  })

  test('Process push notification for create playlist', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [
      { subscriber_id: 2, user_id: 1 }
    ])
    await createPlaylists(processor.discoveryDB, [
      {
        playlist_id: 10,
        playlist_owner_id: 1,
        playlist_name: 'I am a playlist'
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
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: 'New Artist Update',
        body: 'user_1 released a new playlist I am a playlist',
        data: {
          type: 'UserSubscription',
          id: 'timestamp:1589373217:group_id:create:playlist_id:10',
          entityIds: [10],
          userId: 1,
          entityType: 'Playlist'
        }
      }
    )
  })

  test('Process email notification for create playlist', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [
      { subscriber_id: 2, user_id: 1 }
    ])
    await createPlaylists(processor.discoveryDB, [
      {
        playlist_id: 10,
        playlist_owner_id: 1,
        playlist_name: 'I am a playlist'
      }
    ])
    const data: CreatePlaylistNotification = {
      playlist_id: 10,
      is_album: false
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'create',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'create:playlist:1',
        data,
        user_ids: [2],
        receiver_user_id: 2
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

  test('Process push notification for create album', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [
      { subscriber_id: 2, user_id: 1 }
    ])
    await createPlaylists(processor.discoveryDB, [
      {
        playlist_id: 10,
        playlist_owner_id: 1,
        playlist_name: 'I am an album',
        is_album: true
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
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: 'New Artist Update',
        body: 'user_1 released a new album I am an album',
        data: {
          type: 'UserSubscription',
          id: 'timestamp:1589373217:group_id:create:playlist_id:10',
          entityIds: [10],
          userId: 1,
          entityType: 'Album'
        }
      }
    )
  })

  test('Process email notification for create album', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createSubscription(processor.discoveryDB, [
      { subscriber_id: 2, user_id: 1 }
    ])
    await createPlaylists(processor.discoveryDB, [
      {
        is_album: true,
        playlist_id: 10,
        playlist_owner_id: 1,
        playlist_name: 'I am an album'
      }
    ])
    const data: CreatePlaylistNotification = {
      playlist_id: 10,
      is_album: true
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'create',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'create:playlist:10',
        data,
        user_ids: [2],
        receiver_user_id: 2
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
