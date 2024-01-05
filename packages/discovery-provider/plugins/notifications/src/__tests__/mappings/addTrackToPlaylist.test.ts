import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import {
  AddTrackToPlaylistNotification,
  AppEmailNotification
} from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTracks,
  createPlaylists,
  createBlocks,
  setupTest,
  resetTests
} from '../../utils/populateDB'

describe('Add track to playlist notification', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2020-05-13T12:33:37.000Z'))
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for add track to playlist', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2, name: 'user_2' }
    ])
    await createTracks(processor.discoveryDB, [
      { track_id: 10, owner_id: 1, title: 'title_track' }
    ])
    const createdAt = new Date()
    const trackAddedTime = Math.floor(
      new Date(createdAt.getTime() + 60 * 1000).getTime() / 1000
    )
    await createBlocks(processor.discoveryDB, [{ number: 1 }])
    await createPlaylists(processor.discoveryDB, [
      {
        blocknumber: 1,
        playlist_owner_id: 2,
        playlist_name: 'title_of_playlist',
        created_at: createdAt,
        playlist_id: 55,
        playlist_contents: { track_ids: [{ time: trackAddedTime, track: 10 }] }
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
        title: 'Your track got on a playlist! 💿',
        body: `user_2 added title_track to their playlist title_of_playlist`,
        data: {
          id: 'timestamp:1589373217:group_id:track_added_to_playlist:playlist_id:55:track_id:10',
          playlistId: 55,
          type: 'AddTrackToPlaylist'
        }
      }
    )
  })

  test('Render a single Add Track To Playlist email', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2, name: 'user_2' }
    ])
    await createTracks(processor.discoveryDB, [
      { track_id: 10, owner_id: 1, title: 'title_track' }
    ])
    const createdAt = new Date()
    const trackAddedTime = Math.floor(
      new Date(createdAt.getTime() + 60 * 1000).getTime() / 1000
    )
    await createBlocks(processor.discoveryDB, [{ number: 1 }])
    await createPlaylists(processor.discoveryDB, [
      {
        blocknumber: 1,
        playlist_owner_id: 2,
        playlist_name: 'title_of_playlist',
        created_at: createdAt,
        playlist_id: 55,
        playlist_contents: { track_ids: [{ time: trackAddedTime, track: 10 }] }
      }
    ])

    const data: AddTrackToPlaylistNotification = {
      track_id: 10,
      playlist_id: 55
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'track_added_to_playlist',
        timestamp: new Date(),
        specifier: '1',
        group_id:
          'track_added_to_playlist:playlist_id:55:track_id:10:blocknumber:1',
        data,
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
