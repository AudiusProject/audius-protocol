import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import {
  AppEmailNotification,
  TipReceiveNotification
} from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createUserTip,
  setupTest,
  resetTests
} from '../../utils/populateDB'

describe('Tip Notification', () => {
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

  test('Process push notification for tip receive', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    // NOTE: User tips stored as a string with 8 significant digits
    await createUserTip(processor.discoveryDB, [
      { sender_user_id: 2, receiver_user_id: 1, amount: '500000000' }
    ])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const reactionNotifications = pending.appNotifications.filter(
      (n) => n.type === 'tip_receive'
    )
    expect(reactionNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(reactionNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title: 'You Received a Tip!',
        body: `User_2 sent you a tip of 5 $AUDIO`,
        data: {
          entityId: 2,
          id: 'timestamp:1589373217:group_id:tip_receive:user_id:1:signature:sig_2_1',
          type: 'TipReceive'
        }
      }
    )
  })

  test('Process email notification for tip receive', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    // NOTE: User tips stored as a string with 8 significant digits
    await createUserTip(processor.discoveryDB, [
      { sender_user_id: 2, receiver_user_id: 1, amount: '500000000' }
    ])

    const data: TipReceiveNotification = {
      amount: 500000000,
      sender_user_id: 2,
      receiver_user_id: 1
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'tip_receive',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'tip_receive:user_id:1:slot:145421349',
        data,
        user_ids: [2],
        receiver_user_id: 2
      }
    ]
    const notifHtml = await renderEmail({
      userId: 2,
      email: 'joey@audius.co',
      frequency: 'daily',
      notifications,
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })

    expect(notifHtml).toMatchSnapshot()
  })
})
