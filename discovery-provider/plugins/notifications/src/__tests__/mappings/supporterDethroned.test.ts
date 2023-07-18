import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import * as sendEmailFns from '../../email/notifications/sendEmail'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createSupporterRankUp,
  createUserBankTx,
  setupTest,
  resetTests
} from '../../utils/populateDB'

describe('Supporter Dethroned Notification', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  const sendEmailNotificationSpy = jest
    .spyOn(sendEmailFns, 'sendNotificationEmail')
    .mockImplementation(() => Promise.resolve(true))

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for supporter dethroned receive', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 }
    ])
    await createUserBankTx(processor.discoveryDB, [
      { signature: '1', slot: 1 },
      { signature: '2', slot: 2 }
    ])

    await createSupporterRankUp(processor.discoveryDB, [
      { sender_user_id: 2, receiver_user_id: 1, rank: 1, slot: 1 }
    ])
    await createSupporterRankUp(processor.discoveryDB, [
      { sender_user_id: 3, receiver_user_id: 1, rank: 1, slot: 2 }
    ])

    await insertMobileSettings(processor.identityDB, [
      { userId: 1 },
      { userId: 2 }
    ])
    await insertMobileDevices(processor.identityDB, [
      { userId: 1 },
      { userId: 2 }
    ])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const dethronedNotifications = pending.appNotifications.filter(
      (n) => n.type === 'supporter_dethroned'
    )
    expect(dethronedNotifications).toHaveLength(1)

    // Assert single pending
    await processor.appNotificationsProcessor.process(dethronedNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title: "👑 You've Been Dethroned!",
        body: `Handle_3 dethroned you as user_1's #1 Top Supporter! Tip to reclaim your spot?`,
        data: {
          entityId: 1,
          id: 'timestamp:1589373217:group_id:supporter_dethroned:receiver_user_id:1:slot:2',
          type: 'SupporterDethroned',
          supportedUserId: 1
        }
      }
    )
    expect(sendEmailNotificationSpy).not.toHaveBeenCalled()
  })
})
