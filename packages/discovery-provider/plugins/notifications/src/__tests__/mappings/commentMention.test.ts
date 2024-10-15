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
  createCommentMentions
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { commenttype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Comment Mention Notification', () => {
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

  test('Process push notification for comment mention on others track', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 1, owner_id: 1 }])
    await createComments(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 1,
        entity_id: 1,
        entity_type: commenttype.track
      }
    ])
    await createCommentMentions(processor.discoveryDB, [
      { comment_id: 1, user_id: 2 }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
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
        title: 'New Mention',
        body: "user_1 tagged you in a comment on user_1's track track_title_1",
        data: {
          id: 'timestamp:1589373217:group_id:comment_mention:1:type:Track',
          type: 'CommentMention',
          userIds: [1]
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
      }
    ])

    await createCommentMentions(processor.discoveryDB, [
      { comment_id: 1, user_id: 2 }
    ])

    await new Promise((resolve) => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        type: 'comment_mention',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'comment_mention:1:type:Track',
        data: {
          type: EntityType.Track,
          entity_id: 1,
          entity_user_id: 1,
          comment_user_id: 1
        },
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
        user_id: 3,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 2,
        user_id: 4,
        entity_id: 1,
        entity_type: commenttype.track
      },
      {
        comment_id: 3,
        user_id: 5,
        entity_id: 1,
        entity_type: commenttype.track
      }
    ])

    await createCommentMentions(processor.discoveryDB, [
      { comment_id: 1, user_id: 2 },
      { comment_id: 2, user_id: 2 },
      { comment_id: 3, user_id: 2 }
    ])

    const notifications: AppEmailNotification[] = Array.from(
      new Array(3),
      (_, num) => ({
        type: 'comment_mention',
        timestamp: new Date(),
        specifier: (num + 3).toString(),
        group_id: 'comment_mention:1:type:Track',
        data: {
          type: EntityType.Track,
          comment_user_id: num + 3,
          entity_id: 1,
          entity_user_id: 1
        },
        user_ids: [2],
        receiver_user_id: 2
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
