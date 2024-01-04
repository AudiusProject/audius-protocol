import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createReposts,
  createTracks,
  insertFollows,
  createPlaylists,
  resetTests,
  setupTest
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'

describe('Repost Of Repost Notification', () => {
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

  const createEntityToRepost = async (entityType) => {
    switch (entityType) {
      case EntityType.Track:
        await createTracks(processor.discoveryDB, [
          { track_id: 10, owner_id: 1 }
        ])
        break
      case EntityType.Playlist:
        await createPlaylists(processor.discoveryDB, [
          { playlist_id: 10, playlist_owner_id: 1 }
        ])
        break
      case EntityType.Album:
        await createPlaylists(processor.discoveryDB, [
          { playlist_id: 10, playlist_owner_id: 1, is_album: true }
        ])
        break
      default:
        break
    }
  }

  const setUpRepostOfRepostMockData = async (entityType) => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 }
    ])
    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 3, followee_user_id: 2 }
    ])
    await createEntityToRepost(entityType)
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 10,
        repost_type: entityType,
        created_at: new Date(Date.now() - 10)
      }
    ])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 3,
        repost_item_id: 10,
        repost_type: entityType,
        is_repost_of_repost: true
      }
    ])
  }

  test('Process push notification for repost of repost track', async () => {
    await setUpRepostOfRepostMockData(EntityType.Track)
    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(4)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)
    expect(sendPushNotificationSpy.mock.lastCall).toMatchObject([
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 2
      },
      {
        title: 'New Repost',
        body: 'user_3 reposted your repost of track_title_10',
        data: {
          id: 'timestamp:1589373217:group_id:repost_of_repost:10:type:track',
          type: 'RepostOfRepost',
          entityType: 'Track',
          entityId: 10,
          userIds: [3]
        }
      }
    ])
  })

  test('Process push notification for repost of repost playlist', async () => {
    await setUpRepostOfRepostMockData(EntityType.Playlist)
    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(4)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)
    expect(sendPushNotificationSpy.mock.lastCall).toMatchObject([
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 2
      },
      {
        title: 'New Repost',
        body: 'user_3 reposted your repost of playlist_name_10',
        data: {
          id: 'timestamp:1589373217:group_id:repost_of_repost:10:type:playlist',
          type: 'RepostOfRepost',
          userIds: [3],
          entityType: 'Playlist',
          entityId: 10
        }
      }
    ])
  })

  test('Process push notification for repost of album', async () => {
    await setUpRepostOfRepostMockData(EntityType.Album)
    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(4)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)
    expect(sendPushNotificationSpy.mock.lastCall).toMatchObject([
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 2
      },
      {
        title: 'New Repost',
        body: 'user_3 reposted your repost of playlist_name_10',
        data: {
          id: 'timestamp:1589373217:group_id:repost_of_repost:10:type:album',
          type: 'RepostOfRepost',
          userIds: [3],
          entityType: 'Album',
          entityId: 10
        }
      }
    ])
  })

  test('Render a single email', async () => {
    await setUpRepostOfRepostMockData(EntityType.Playlist)
    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await new Promise((resolve) => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        type: 'repost_of_repost',
        timestamp: new Date(),
        specifier: '3',
        group_id: 'repost_of_repost:10:type:playlist',
        data: {
          type: EntityType.Playlist,
          user_id: 3,
          repost_of_repost_item_id: 10
        },
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
})
