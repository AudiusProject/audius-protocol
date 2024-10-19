import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTracks,
  setupTest,
  resetTests,
  createComments,
  insertNotifications
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { commenttype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Comment Notification', () => {
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

  test('Process push notification for comment on track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createComments(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 2,
        entity_id: 10,
        entity_type: commenttype.track
      }
    ])
    await insertNotifications(processor.discoveryDB, [
      {
        blocknumber: 1,
        user_ids: [1],
        timestamp: new Date(1589373217),
        type: 'comment',
        specifier: '2',
        group_id: 'comment:10:type:Track',
        data: {
          type: 'Track',
          entity_id: 10,
          comment_user_id: 2
        }
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
        title: 'New Comment',
        body: 'user_2 commented on your track track_title_10',
        data: {
          id: 'timestamp:1589373:group_id:comment:10:type:Track',
          type: 'Comment',
          userIds: [2]
        }
      }
    )
  })

  test('Render a single email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createComments(processor.discoveryDB, [
      {
        user_id: 2,
        entity_id: 10,
        entity_type: commenttype.track
      }
    ])

    await new Promise((resolve) => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        type: 'comment',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'comment:10:type:track',
        data: {
          type: EntityType.Track,
          comment_user_id: 2,
          entity_id: 10
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

  test('Render a multi comment email', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 },
      { user_id: 4 },
      { user_id: 5 }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])

    await createComments(processor.discoveryDB, [
      { user_id: 2, entity_id: 10, entity_type: commenttype.track },
      { user_id: 3, entity_id: 10, entity_type: commenttype.track },
      { user_id: 4, entity_id: 10, entity_type: commenttype.track },
      { user_id: 5, entity_id: 10, entity_type: commenttype.track }
    ])

    const notifications: AppEmailNotification[] = Array.from(
      new Array(4),
      (_, num) => ({
        type: 'comment',
        timestamp: new Date(),
        specifier: (num + 2).toString(),
        group_id: 'comment:10:type:track',
        data: {
          type: EntityType.Track,
          comment_user_id: num + 2,
          entity_id: 10
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
