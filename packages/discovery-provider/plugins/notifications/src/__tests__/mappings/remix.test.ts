import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTracks,
  createBlocks,
  setupTest,
  resetTests
} from '../../utils/populateDB'
import {
  AppEmailNotification,
  RemixNotification
} from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'

describe('Remix Notification', () => {
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

  test('Process push notification for remix track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])

    await createBlocks(processor.discoveryDB, [{ number: 1 }])

    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createTracks(processor.discoveryDB, [
      {
        track_id: 20,
        owner_id: 2,
        blocknumber: 1,
        remix_of: { tracks: [{ parent_track_id: 10 }] }
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
        title: 'New Remix Of Your Track ♻️',
        body: 'New remix of your track track_title_10: user_2 uploaded track_title_20',
        data: {
          childTrackId: 20,
          id: 'timestamp:1589373217:group_id:remix:track:20:parent_track:10:blocknumber:1',
          type: 'RemixCreate'
        }
      }
    )
  })

  test('Render a single Remix email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])

    await createBlocks(processor.discoveryDB, [{ number: 1 }])

    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createTracks(processor.discoveryDB, [
      {
        track_id: 20,
        owner_id: 2,
        blocknumber: 1,
        remix_of: { tracks: [{ parent_track_id: 10 }] }
      }
    ])

    const data: RemixNotification = {
      track_id: 20,
      parent_track_id: 10
    }
    const notifications: AppEmailNotification[] = [
      {
        type: 'remix',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'remix:track:20:parent_track:10:blocknumber:1',
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
