import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  dropTestDB,
  createSupporterRankUp,
  createUserBankTx,
  setupTest
} from '../../utils/populateDB'

describe('Supporter Dethroned Notification', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
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
        data: {}
      }
    )
  })
})
