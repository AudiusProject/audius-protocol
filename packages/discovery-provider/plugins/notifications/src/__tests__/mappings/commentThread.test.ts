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
  createCommentThreads
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { commenttype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Comment Thread Notification', () => {
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

  test('Process push notification for comment thread on your track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 1, owner_id: 1 }])
    await createComments(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 1,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 2,
        user_id: 2,
        entity_id: 1,
        entity_type: commenttype.track
      }
    ])
    await createCommentThreads(processor.discoveryDB, [
      {
        comment_id: 2,
        parent_comment_id: 1
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(2)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenNthCalledWith(
      2,
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 2
      },
      {
        title: 'New Reply',
        body: 'user_2 replied to your comment on your track track_title_1',
        data: {
          id: 'timestamp:1589373217:group_id:comment_thread:1',
          type: 'CommentThread',
          userIds: [2]
        }
      }
    )
  })

  test('Process push notification for comment thread on others track', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 1, owner_id: 3 }])
    await createComments(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 1,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 2,
        user_id: 2,
        entity_id: 1,
        entity_type: commenttype.track
      }
    ])
    await createCommentThreads(processor.discoveryDB, [
      {
        comment_id: 2,
        parent_comment_id: 1
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(3)
    // Assert single pending
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'New Reply',
        body: "user_2 replied to your comment on user_3's track track_title_1",
        data: {
          id: 'timestamp:1589373217:group_id:comment_thread:1',
          type: 'CommentThread',
          userIds: [2]
        }
      }
    )
  })

  test('Render a single email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 1, owner_id: 1 }])
    await createComments(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 1,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 2,
        user_id: 2,
        entity_id: 1,
        entity_type: commenttype.track
      }
    ])

    await createCommentThreads(processor.discoveryDB, [
      { comment_id: 2, parent_comment_id: 1 }
    ])

    await new Promise((resolve) => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        type: 'comment_thread',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'comment_thread:1',
        data: {
          type: EntityType.Track,
          entity_id: 1,
          entity_user_id: 1,
          comment_user_id: 2
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
    await createTracks(processor.discoveryDB, [{ track_id: 1, owner_id: 1 }])

    await createComments(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 2,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 2,
        user_id: 3,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 3,
        user_id: 4,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 4,
        user_id: 5,
        entity_id: 1,
        entity_type: commenttype.track
      }
    ])

    await createCommentThreads(processor.discoveryDB, [
      { comment_id: 2, parent_comment_id: 1 },
      { comment_id: 3, parent_comment_id: 1 },
      { comment_id: 4, parent_comment_id: 1 }
    ])

    const notifications: AppEmailNotification[] = Array.from(
      new Array(3),
      (_, num) => ({
        type: 'comment_thread',
        timestamp: new Date(),
        specifier: (num + 3).toString(),
        group_id: 'comment_thread:1',
        data: {
          type: EntityType.Track,
          comment_user_id: num + 3,
          entity_id: 1,
          entity_user_id: 1
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
