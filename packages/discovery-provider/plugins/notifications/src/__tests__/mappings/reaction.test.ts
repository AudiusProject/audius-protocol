import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import {
  AppEmailNotification,
  ReactionNotification
} from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createUserTip,
  createReaction,
  setupTest,
  resetTests
} from '../../utils/populateDB'

describe('Reaction Notification', () => {
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

  test('Process push notification for reaction', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    // NOTE: User tips stored as a string with 8 significant digits
    await createUserTip(processor.discoveryDB, [
      { sender_user_id: 2, receiver_user_id: 1, amount: '500000000' }
    ])
    await createReaction(processor.discoveryDB, [
      {
        reacted_to: 'sig_2_1',
        reaction_type: 'tip',
        sender_wallet: '0x1',
        reaction_value: 2
      }
    ])
    // Create reaction to tip

    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const reactionNotifications = pending.appNotifications.filter(
      (n) => n.type === 'reaction'
    )
    expect(reactionNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(reactionNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: `User_1 reacted`,
        body: `User_1 reacted to your tip of 5 $AUDIO`,
        data: {
          entityId: 1,
          id: 'timestamp:1589373217:group_id:reaction:reaction_to:sig_2_1:reaction_type:tip:reaction_value:2',
          type: 'Reaction'
        }
      }
    )
  })

  test('Process email notification for reaction', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    // NOTE: User tips stored as a string with 8 significant digits
    await createUserTip(processor.discoveryDB, [
      { sender_user_id: 2, receiver_user_id: 1, amount: '500000000' }
    ])
    await createReaction(processor.discoveryDB, [
      {
        reacted_to: 'sig_2_1',
        reaction_type: 'tip',
        sender_wallet: '0x1',
        reaction_value: 2
      }
    ])

    const data: ReactionNotification = {
      reacted_to: '0x1',
      reaction_type: 'tip',
      reaction_value: 1,
      sender_wallet: '0x1',
      receiver_user_id: 1,
      sender_user_id: 2,
      tip_amount: '500000000'
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'reaction',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'reaction:reaction_to:0x1:reaction_type:tip:reaction_value:1',
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
