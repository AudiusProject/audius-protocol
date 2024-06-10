import { expect, jest, test } from '@jest/globals'
import * as sendEmailFns from '../../email/notifications/sendEmail'
import { Processor } from '../../main'
import * as sns from '../../sns'
import * as web from '../../web'

import {
  createGrants,
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  resetTests,
  setUserEmailAndSettings,
  setupTest
} from '../../utils/populateDB'

describe('Request Manager', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  const sendBrowserNotificationSpy = jest
    .spyOn(web, 'sendBrowserNotification')
    .mockImplementation(() => Promise.resolve(3))

  const sendTransactionalEmailSpy = jest
    .spyOn(sendEmailFns, 'sendTransactionalEmail')
    .mockImplementation(() => Promise.resolve(true))

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for request manager', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await setUserEmailAndSettings(processor.identityDB, 'live', 1)

    const timeString = '2024-05-23 00:12:51.695'
    const time = new Date(timeString)
    await createGrants(processor.discoveryDB, [
      {
        user_id: 2,
        grantee_address: `0x${1}`,
        updated_at: time,
        created_at: time
      }
    ])

    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)

    const title = 'Account Management Request'
    const body = `user_2 has invited you to manage their account.`
    await processor.appNotificationsProcessor.process(pending.appNotifications)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:1',
        badgeCount: 1
      },
      {
        title,
        body,
        data: {
          id: `timestamp:1716423171:group_id:request_manager:grantee_user_id:1:grantee_address:0x1:user_id:2:updated_at:${timeString}:created_at:${timeString}`,
          type: 'RequestManager',
          entityId: 2
        }
      }
    )

    expect(sendBrowserNotificationSpy).toHaveBeenCalledWith(
      true,
      expect.any(Object),
      1,
      title,
      body
    )
    expect(sendTransactionalEmailSpy).toHaveBeenCalledWith({
      email: 'user_1@gmail.com',
      html: expect.anything(),
      subject: 'Account Management Request'
    })
  })
})
