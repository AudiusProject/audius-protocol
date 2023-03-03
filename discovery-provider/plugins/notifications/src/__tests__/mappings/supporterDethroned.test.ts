import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import { SupporterDethroned } from '../../processNotifications/mappers/supporterDethroned'
import * as sns from '../../sns'
import { AppEmailNotification, SupporterDethronedNotification } from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTestDB,
  dropTestDB,
  replaceDBName,
  createSupporterRankUp,
  createUserBankTx
} from '../../utils/populateDB'

describe('Supporter Dethroned Notification', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  beforeEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      createTestDB(process.env.DN_DB_URL, testName),
      createTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
    processor = new Processor()
    await processor.init({
      identityDBUrl: replaceDBName(process.env.IDENTITY_DB_URL, testName),
      discoveryDBUrl: replaceDBName(process.env.DN_DB_URL, testName),
    })
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await processor?.close()
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      dropTestDB(process.env.DN_DB_URL, testName),
      dropTestDB(process.env.IDENTITY_DB_URL, testName),
    ])
  })


  test("Process push notification for supporter dethroned receive", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }])
    await createUserBankTx(processor.discoveryDB, [{ signature: '1', slot: 1 }, { signature: '2', slot: 2 }])

    await createSupporterRankUp(processor.discoveryDB, [{ sender_user_id: 2, receiver_user_id: 1, rank: 1, slot: 1 }])
    await createSupporterRankUp(processor.discoveryDB, [{ sender_user_id: 3, receiver_user_id: 1, rank: 1, slot: 2 }])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const dethronedNotifications = pending.appNotifications.filter(n => n.type === 'supporter_dethroned')
    expect(dethronedNotifications).toHaveLength(1)

    // Assert single pending
    await processor.appNotificationsProcessor.process(dethronedNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:2',
      badgeCount: 0
    }, {
      title: "👑 You've Been Dethroned!",
      body: `Handle_3 dethroned you as user_1's #1 Top Supporter! Tip to reclaim your spot?`,
      data: {}
    })
  })

})
