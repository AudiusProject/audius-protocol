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
  createCommentReactions,
  insertNotifications
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { commenttype } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

describe('Comment Reaction Notification', () => {
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

  test.only('Process push notification for reaction on your comment, on your track', async () => {
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
    await createCommentReactions(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 2
      }
    ])
    await insertNotifications(processor.discoveryDB, [
      {
        blocknumber: 1,
        user_ids: [1],
        timestamp: new Date(1589373217),
        type: 'comment_reaction',
        specifier: '2',
        group_id: 'comment_reaction:1',
        data: {
          type: 'Track',
          entity_id: 1,
          entity_user_id: 1,
          comment_id: 1,
          comment_user_id: 1,
          reacter_user_id: 2
        }
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'New Reaction',
        body: 'user_2 liked your comment on your track track_title_1',
        data: {
          id: 'timestamp:1589373:group_id:comment_reaction:1',
          type: 'CommentReaction',
          entityType: 'track',
          entityId: 1,
          entityUserId: 1,
          userIds: [2]
        }
      }
    )
  })

  test.only('Process push notification for comment reaction on others track', async () => {
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
      }
    ])
    await createCommentReactions(processor.discoveryDB, [
      {
        comment_id: 1,
        user_id: 2
      }
    ])
    await insertNotifications(processor.discoveryDB, [
      {
        blocknumber: 1,
        user_ids: [1],
        timestamp: new Date(1589373217),
        type: 'comment_reaction',
        specifier: '2',
        group_id: 'comment_reaction:1',
        data: {
          type: 'Track',
          entity_id: 1,
          entity_user_id: 3,
          reacter_user_id: 2
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
        title: 'New Reaction',
        body: "user_2 liked your comment on user_3's track track_title_1",
        data: {
          id: 'timestamp:1589373:group_id:comment_reaction:1',
          type: 'CommentReaction',
          entityType: 'track',
          entityId: 1,
          entityUserId: 3,
          userIds: [2]
        }
      }
    )
  })

  test.only('Render a single email', async () => {
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

    await createCommentReactions(processor.discoveryDB, [
      { comment_id: 1, user_id: 2 }
    ])

    await new Promise((resolve) => setTimeout(resolve, 10))

    const notifications: AppEmailNotification[] = [
      {
        type: 'comment_reaction',
        timestamp: new Date(),
        specifier: '2',
        group_id: 'comment_reaction:1',
        data: {
          type: EntityType.Track,
          entity_id: 1,
          entity_user_id: 1,
          comment_id: 1,
          reacter_user_id: 2
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

  test.only('Render a multi comment email', async () => {
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

    await createCommentReactions(processor.discoveryDB, [
      { comment_id: 2, user_id: 2 },
      { comment_id: 3, user_id: 3 },
      { comment_id: 4, user_id: 4 }
    ])

    const notifications: AppEmailNotification[] = Array.from(
      new Array(3),
      (_, num) => ({
        type: 'comment_reaction',
        timestamp: new Date(),
        specifier: (num + 3).toString(),
        group_id: 'comment_reaction:1',
        data: {
          type: EntityType.Track,
          entity_id: 1,
          entity_user_id: 1,
          reacter_user_id: num + 3
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
