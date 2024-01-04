import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import {
  AppEmailNotification,
  SupporterRankUpNotification
} from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createSupporterRankUp,
  createUserBankTx,
  setupTest,
  resetTests
} from '../../utils/populateDB'

describe('Supporter Rank Up Notification', () => {
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

  test('Process push notification for supporter rank up', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createUserBankTx(processor.discoveryDB, [{ signature: '1', slot: 1 }])
    await createSupporterRankUp(processor.discoveryDB, [
      { sender_user_id: 2, receiver_user_id: 1, rank: 2 }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()

    const reactionNotifications = pending?.appNotifications.filter(
      (n) => n.type === 'supporter_rank_up'
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
        title: `#2 Top Supporter`,
        body: `User_2 became your #2 Top Supporter!`,
        data: {
          entityId: 2,
          id: 'timestamp:1589373217:group_id:supporter_rank_up:2:slot:1',
          type: 'SupporterRankUp'
        }
      }
    )
  })

  test('Process email notification for supporter rank up', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createUserBankTx(processor.discoveryDB, [{ signature: '1', slot: 1 }])
    await createSupporterRankUp(processor.discoveryDB, [
      { sender_user_id: 2, receiver_user_id: 1, rank: 2 }
    ])

    const data: SupporterRankUpNotification = {
      rank: 2,
      sender_user_id: 2,
      receiver_user_id: 1
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'supporter_rank_up',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'supporter_rank_up:2:slot:145422128',
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
