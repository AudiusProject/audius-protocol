import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import { AppEmailNotification } from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  insertNotifications,
  setupTest,
  resetTests,
  createPlaylists
} from '../../utils/populateDB'

describe('Trending Playlist Notification', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor

    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [
      { playlist_id: 1, playlist_owner_id: 1 }
    ])
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for trending playlist track', async () => {
    await insertNotifications(processor.discoveryDB, [
      {
        id: 1,
        specifier: '1',
        group_id:
          'trending_playlist:time_range:week:genre:all:rank:1:playlist_id:1:timestamp:1677261600',
        type: 'trending_playlist',
        timestamp: new Date(),
        data: { rank: 1, genre: 'all', playlist_id: 1, time_range: 'week' },
        user_ids: [1]
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
    const pending = processor.listener.takePending()
    const playlistNotifications = pending.appNotifications.filter(
      (n) => n.type === 'trending_playlist'
    )

    expect(playlistNotifications).toHaveLength(1)

    await processor.appNotificationsProcessor.process(playlistNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'Congrats - You’re Trending! 📈',
        body: `Your Playlist playlist_name_1 is the #1 Trending Playlist on Audius Right Now! 🍾`,
        data: {}
      }
    )
  })

  test('Render a single email', async () => {
    const notifications: AppEmailNotification[] = [
      {
        timestamp: new Date(),
        specifier: '10',
        group_id:
          'trending_playlist:time_range:week:genre:all:rank:1:track_id:1:timestamp:1677261600',
        type: 'trending_playlist',
        data: { rank: 3, genre: 'all', playlist_id: 1, time_range: 'week' },
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
