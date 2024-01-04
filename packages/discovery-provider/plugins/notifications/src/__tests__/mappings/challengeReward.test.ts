import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import {
  AppEmailNotification,
  ChallengeRewardNotification
} from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createChallengeReward,
  createRewardManagerTx,
  setupTest,
  resetTests
} from '../../utils/populateDB'

describe('Challenge Reward Notification', () => {
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

  test('Process push notification for challenge reward rank up', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createRewardManagerTx(processor.discoveryDB, [
      { slot: 1, signature: '0x1' }
    ])
    await createChallengeReward(processor.discoveryDB, [
      {
        challenge_id: 'profile-completion',
        user_id: 1,
        specifier: '1',
        amount: '100000000'
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const reactionNotifications = pending?.appNotifications.filter(
      (n) => n.type === 'challenge_reward'
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
        title: `✅️ Complete your Profile`,
        body: `You’ve earned 1 $AUDIO for completing this challenge!`,
        data: {
          id: 'timestamp:1589373217:group_id:challenge_reward:1:challenge:profile-completion:specifier:1',
          type: 'ChallengeReward'
        }
      }
    )
  })

  test('Render a single challenge reward email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])

    const data: ChallengeRewardNotification = {
      amount: 100000000,
      specifier: '1=>2',
      challenge_id: 'referrals'
    }

    const notifications: AppEmailNotification[] = [
      {
        type: 'challenge_reward',
        timestamp: new Date(),
        specifier: '1',
        group_id: 'challenge_reward:2:challenge:referrals:specifier:1=>2',
        data,
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
})
