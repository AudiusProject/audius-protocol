import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  dropTestDB,
  createTracks,
  createBlocks,
  createReposts,
  setupTest
} from '../../utils/populateDB'

import {
  AppEmailNotification,
  CosignRemixNotification
} from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { RepostType } from '../../types/dn'

describe('Cosign Notification', () => {
  let processor: Processor
  // Mock current date for test result consistency
  Date.now = jest.fn(() => new Date('2020-05-13T12:33:37.000Z').getTime())

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await processor?.close()
    const testName = expect
      .getState()
      .currentTestName.replace(/\s/g, '_')
      .toLocaleLowerCase()

    await Promise.all([
      dropTestDB(process.env.DN_DB_URL, testName),
      dropTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
  })

  test('Process push notification for cosign remixed track', async () => {
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
    await createReposts(processor.discoveryDB, [
      {
        user_id: 1,
        repost_item_id: 20,
        repost_type: RepostType.track
      }
    ])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const cosignNotifications = pending.appNotifications.filter(
      (n) => n.type === 'cosign'
    )
    expect(cosignNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(cosignNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'New Track Co-Sign! 🔥',
        body: 'user_1 Co-Signed your Remix of track_title_20',
        data: {}
      }
    )
  })

  test('Render a single cosign email', async () => {
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

    const data: CosignRemixNotification = {
      track_id: 20,
      track_owner_id: 2,
      parent_track_id: 10
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'cosign',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'cosign:parent_track:1:original_track:1',
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
