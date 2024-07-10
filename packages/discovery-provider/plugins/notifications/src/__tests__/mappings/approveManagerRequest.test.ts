import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import * as web from '../../web'
import * as sendEmailFns from '../../email/notifications/sendEmail'

import {
  createGrants,
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  resetTests,
  setUserEmailAndSettings,
  setupTest
} from '../../utils/populateDB'
import { renderEmail } from '../../email/notifications/renderEmail'
import { AppEmailNotification } from '../../types/notifications'

describe('ApproveManagerRequest', () => {
  let processor: Processor

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  const sendEmailNotificationSpy = jest
    .spyOn(sendEmailFns, 'sendNotificationEmail')
    .mockImplementation(() => Promise.resolve(true))

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

  test('Process notifications for approve manager request', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await setUserEmailAndSettings(processor.identityDB, 'live', 2)

    const createdAtTimeString = '2024-05-23 00:12:51.695'
    const createdAtTime = new Date(createdAtTimeString)
    const updatedAtTime = new Date('2024-05-25 00:12:51.695081')

    await createGrants(processor.discoveryDB, [
      {
        user_id: 2,
        grantee_address: '0x1',
        updated_at: updatedAtTime,
        created_at: createdAtTime,
        is_approved: true
      }
    ])

    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])

    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)

    const title = 'New Account Manager Added'
    const body = `user_1 has been added as a manager on your account.`
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
          id: `timestamp:1716595971:group_id:approve_manager_request:grantee_user_id:1:grantee_address:0x1:user_id:2:created_at:${createdAtTimeString}`,
          type: 'ApproveManagerRequest',
          entityId: 2
        }
      }
    )

    expect(sendBrowserNotificationSpy).toHaveBeenCalledWith(
      true,
      expect.any(Object),
      2,
      title,
      body
    )

    expect(sendEmailNotificationSpy).toHaveBeenCalledWith({
      userId: 2,
      email: 'user_2@gmail.com',
      frequency: 'live',
      notifications: [
        expect.objectContaining({
          specifier: '1',
          group_id: `approve_manager_request:grantee_user_id:1:grantee_address:0x1:user_id:2:created_at:${createdAtTimeString}`,
          type: 'approve_manager_request'
        })
      ],
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
  })

  test('Render a single email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    const createdAtTimeString = '2024-05-23 00:12:51.695'
    const createdAtTime = new Date(createdAtTimeString)
    const updatedAtTime = new Date('2024-05-25 00:12:51.695081')
    await setUserEmailAndSettings(processor.identityDB, 'live', 2)
    await createGrants(processor.discoveryDB, [
      {
        user_id: 2,
        grantee_address: '0x1',
        updated_at: updatedAtTime,
        created_at: createdAtTime,
        is_approved: true
      }
    ])

    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])

    const notifications: AppEmailNotification[] = [
      {
        type: 'approve_manager_request',
        timestamp: new Date(),
        specifier: '2',
        group_id: `approve_manager_request:grantee_user_id:1:grantee_address:0x1:user_id:2:created_at:${createdAtTimeString}`,
        data: {
          grantee_user_id: 1,
          grantee_address: '0x1',
          user_id: 2
        },
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
