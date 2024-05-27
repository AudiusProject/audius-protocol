import { expect, jest, test } from '@jest/globals'
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

describe('ApproveManagerRequest', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  const sendBrowserNotificationSpy = jest
    .spyOn(web, 'sendBrowserNotification')
    .mockImplementation(() => Promise.resolve(3))

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for approve manager request', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    const createdAtTime = new Date('2024-05-23 00:12:51.695081')
    const updatedAtTime = new Date('2024-05-25 00:12:51.695081')
    await createGrants(processor.discoveryDB, [
      {
        user_id: 2,
        grantee_address: `0x${2}`,
        updated_at: createdAtTime,
        created_at: updatedAtTime,
        is_approved: true
      }
    ])

    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await setUserEmailAndSettings(processor.identityDB, 'live', 2)

    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)

    const title = 'New Account Manager Added'
    const body = `user_2 has been added as a manager on your account.`
    await processor.appNotificationsProcessor.process(pending.appNotifications)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      {
        type: 'ios',
        targetARN: 'arn:2',
        badgeCount: 1
      },
      {
        title,
        body,
        data: {
          id: `timestamp:1589373217:group_id:request_manager:grantee_user_id:1:user_id:2:updated_at:${updatedAtTime}:created_at:${createdAtTime}`,
          type: 'ApproveManagerRequest',
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
  })
})
