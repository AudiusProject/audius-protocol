import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  setupTest,
  resetTests,
  insertAbusiveSettings,
  createAbusiveSettingForUser,
  setUserEmailAndSettings
} from '../../utils/populateDB'

import { buildUserNotificationSettings } from '../../processNotifications/mappers/userNotificationSettings'

describe('user notification settings', () => {
  let processor: Processor

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3 }
    ])
    await setUserEmailAndSettings(processor.identityDB, 'live', 1)
    await setUserEmailAndSettings(processor.identityDB, 'live', 2)
    await setUserEmailAndSettings(processor.identityDB, 'live', 3)
    await insertMobileSettings(processor.identityDB, [
      { userId: 1 },
      { userId: 2 },
      { userId: 3 }
    ])
    await insertMobileDevices(processor.identityDB, [
      { userId: 1 },
      { userId: 2 },
      { userId: 3 }
    ])
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  describe('should send push notification', () => {
    test('happy path', async () => {
      const userNotificationSettings = await buildUserNotificationSettings(
        processor.identityDB,
        [1, 2]
      )
      const [initiatorUserId, receiverUserId] = [1, 2]
      expect(
        userNotificationSettings.shouldSendPushNotification({
          initiatorUserId,
          receiverUserId
        })
      ).toBe(true)
      expect(
        userNotificationSettings.shouldSendPushNotification({
          receiverUserId
        })
      ).toBe(true)
    })

    test('contains abusive initiator', async () => {
      await insertAbusiveSettings(processor.identityDB, [
        createAbusiveSettingForUser(3, true, false, false)
      ])
      const userNotificationSettings = await buildUserNotificationSettings(
        processor.identityDB,
        [2, 3]
      )
      const [initiatorUserId, receiverUserId] = [3, 2]
      expect(
        userNotificationSettings.shouldSendPushNotification({
          receiverUserId,
          initiatorUserId
        })
      ).toBe(false)
    })

    test('contains abusive receiver', async () => {
      await insertAbusiveSettings(processor.identityDB, [
        createAbusiveSettingForUser(3, false, true, false)
      ])
      const userNotificationSettings = await buildUserNotificationSettings(
        processor.identityDB,
        [2, 3]
      )
      const [initiatorUserId, receiverUserId] = [2, 3]
      expect(
        userNotificationSettings.shouldSendPushNotification({
          receiverUserId,
          initiatorUserId
        })
      ).toBe(false)
    })
  })

  describe('should send email', () => {
    it('initiator not abusive but receiver is', async () => {
      await insertAbusiveSettings(processor.identityDB, [
        // user 1 not abusive, user 2 not abusive but email not deliverable
        createAbusiveSettingForUser(1, false, false, true),
        createAbusiveSettingForUser(2, false, false, false)
      ])
      const settings = await buildUserNotificationSettings(
        processor.identityDB,
        [1, 2]
      )
      const [initiatorUserId, receiverUserId] = [1, 2]
      expect(
        settings.shouldSendEmailAtFrequency({
          receiverUserId,
          initiatorUserId,
          frequency: 'frequency'
        })
      ).toBe(false)
    })
    it('initiator abusive but receiver not', async () => {
      await insertAbusiveSettings(processor.identityDB, [
        // user 1 abusive, user 2 not abusive and email is deliverable
        createAbusiveSettingForUser(1, false, true, true),
        createAbusiveSettingForUser(2, false, false, true)
      ])
      const settings = await buildUserNotificationSettings(
        processor.identityDB,
        [1, 2]
      )
      const [initiatorUserId, receiverUserId] = [1, 2]
      expect(
        settings.shouldSendEmailAtFrequency({
          receiverUserId,
          initiatorUserId,
          frequency: 'live'
        })
      ).toBe(false)
    })
    it('both initiator and receiver not abusive', async () => {
      const settings = await buildUserNotificationSettings(
        processor.identityDB,
        [1, 2]
      )
      const [initiatorUserId, receiverUserId] = [1, 2]
      expect(
        settings.shouldSendEmailAtFrequency({
          receiverUserId,
          initiatorUserId,
          frequency: 'live'
        })
      ).toBe(true)
    })
  })
})
