import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import { SupportingRankUp } from '../../processNotifications/mappers/supportingRankUp'
import * as sns from '../../sns'
import { AppEmailNotification, SupportingRankUpNotification } from '../../types/notifications'

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

describe('Supporting Rank Up Notification', () => {
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

  test("Process push notification for supporting rank up", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createUserBankTx(processor.discoveryDB, [{ signature: '1', slot: 1 }])
    await createSupporterRankUp(processor.discoveryDB, [{ sender_user_id: 2, receiver_user_id: 1, rank: 2 }])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }, { userId: 2 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    const reactionNotifications = pending?.appNotifications.filter(n => n.type === 'supporting_rank_up')

    expect(reactionNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(reactionNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:2',
      badgeCount: 0
    }, {
      title: `#2 Top Supporter`,
      body: `You're now user_1's #2 Top Supporter!`,
      data: {}
    })
  })

  test("Process email notification for supporting rank up", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createUserBankTx(processor.discoveryDB, [{ signature: '1', slot: 1 }])
    await createSupporterRankUp(processor.discoveryDB, [{ sender_user_id: 2, receiver_user_id: 1, rank: 2 }])

    const data: SupportingRankUpNotification = {
      rank: 2,
      sender_user_id: 2,
      receiver_user_id: 1
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'supporting_rank_up',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'supporting_rank_up:2:slot:145422128',
        data,
        user_ids: [1],
        receiver_user_id: 1
      },
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
