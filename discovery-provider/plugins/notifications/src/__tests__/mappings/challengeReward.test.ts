import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTestDB,
  dropTestDB,
  replaceDBName,
  createSupporterRankUp,
  createUserBankTx,
  createChallengeReward,
  createRewardManagerTx
} from '../../utils/populateDB'

describe('Challenge Reward Notification', () => {
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

  test("Process push notification for challenge reward rank up", async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createRewardManagerTx(processor.discoveryDB, [{ slot: 1, signature: '0x1' }])
    await createChallengeReward(processor.discoveryDB, [{
      challenge_id: 'profile-completion',
      user_id: 1,
      specifier: '1',
      amount: '100000000'
    }])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await new Promise(resolve => setTimeout(resolve, 10))
    const pending = processor.listener.takePending()
    const reactionNotifications = pending?.appNotifications.filter(n => n.type === 'challenge_reward')

    expect(reactionNotifications).toHaveLength(1)
    // Assert single pending
    await processor.appNotificationsProcessor.process(reactionNotifications)

    expect(sendPushNotificationSpy).toHaveBeenCalledWith({
      type: 'ios',
      targetARN: 'arn:1',
      badgeCount: 0
    }, {
      title: `✅️ Complete your Profile`,
      body: `You’ve earned 1 $AUDIO for completing this challenge!`,
      data: {}
    })
  })

})
