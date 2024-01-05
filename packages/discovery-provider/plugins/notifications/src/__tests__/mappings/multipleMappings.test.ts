import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertFollows,
  insertMobileDevices,
  insertMobileSettings,
  createReposts,
  createTracks,
  setupTest,
  resetTests
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { reposttype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Multiple Mappings Notification', () => {
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

  test('Process follow and repost push notification', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 2, followee_user_id: 1 }
    ])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 10,
        repost_type: reposttype.track
      }
    ])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    expect(pending?.appNotifications).toHaveLength(2)
    const follows = pending?.appNotifications.filter((n) => n.type == 'follow')
    await processor.appNotificationsProcessor.process(follows)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'New Follow',
        body: 'user_2 followed you',
        data: {
          id: 'timestamp:1589373217:group_id:follow:1',
          type: 'Follow',
          userIds: [2]
        }
      }
    )

    const reposts = pending?.appNotifications.filter((n) => n.type == 'repost')
    await processor.appNotificationsProcessor.process(reposts)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 2
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

    const badgeCountRes = await processor.identityDB
      .select('iosBadgeCount')
      .from('PushNotificationBadgeCounts')
      .where('userId', 1)
    expect(badgeCountRes[0].iosBadgeCount).toBe(2)
  })

  test('Render multiple notifications in email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await insertFollows(processor.discoveryDB, [
      { follower_user_id: 2, followee_user_id: 1 }
    ])
    await createReposts(processor.discoveryDB, [
      {
        user_id: 2,
        repost_item_id: 10,
        repost_type: reposttype.track
      }
    ])

    const notifications: AppEmailNotification[] = [
      {
        type: 'follow',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'follow:1',
        data: {
          follower_user_id: 2,
          followee_user_id: 1
        },
        user_ids: [1],
        receiver_user_id: 1
      },
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
