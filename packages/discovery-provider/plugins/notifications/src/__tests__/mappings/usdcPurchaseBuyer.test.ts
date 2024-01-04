import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sns from '../../sns'
import * as sendEmailFns from '../../email/notifications/sendEmail'
import * as web from '../../web'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  createTracks,
  setupTest,
  resetTests,
  setUserEmailAndSettings,
  createUSDCPurchase
} from '../../utils/populateDB'

import { AppEmailNotification } from '../../types/notifications'
import { renderEmail } from '../../email/notifications/renderEmail'
import { usdc_purchase_content_type } from '../../types/dn'

describe('USDC Purchase Buyer', () => {
  let processor: Processor

  // Mock current date for test result consistency
  Date.now = jest.fn(() => new Date('2020-05-13T12:33:37.000Z').getTime())

  const sendPushNotificationSpy = jest
    .spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve({ endpointDisabled: false }))

  const sendEmailNotificationSpy = jest
    .spyOn(sendEmailFns, 'sendNotificationEmail')
    .mockImplementation(() => Promise.resolve(true))

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

  test('Process push notification for usdc purchase buyer', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createUSDCPurchase(processor.discoveryDB, [
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.track,
        content_id: 10,
        amount: '1000',
        extra_amount: '0'
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 2 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 2 }])
    await setUserEmailAndSettings(processor.identityDB, 'live', 2)

    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(2)
    // Assert single pending
    const title = 'Purchase Successful'
    const body = `You just purchased track_title_10 from User_1!`
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
          id: 'timestamp:1589373217:group_id:usdc_purchase_buyer:seller_user_id:1:buyer_user_id:2:content_id:10:content_type:track',
          type: 'USDCPurchaseBuyer',
          entityId: 10
        }
      }
    )

    expect(sendEmailNotificationSpy).toHaveBeenCalledWith({
      userId: 2,
      email: 'user_2@gmail.com',
      frequency: 'live',
      notifications: [
        expect.objectContaining({
          specifier: '2',
          group_id:
            'usdc_purchase_buyer:seller_user_id:1:buyer_user_id:2:content_id:10:content_type:track',
          type: 'usdc_purchase_buyer'
        })
      ],
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(sendBrowserNotificationSpy).toHaveBeenCalledWith(
      true,
      expect.any(Object),
      2,
      title,
      body
    )
    expect(sendTransactionalEmailSpy).toHaveBeenCalledWith({
      email: 'user_2@gmail.com',
      html: expect.anything(),
      subject: 'Thank You For Your Support'
    })
  })

  test('Render a single email', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createUSDCPurchase(processor.discoveryDB, [
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.track,
        content_id: 10,
        amount: '1000',
        extra_amount: '0'
      }
    ])

    const notifications: AppEmailNotification[] = [
      {
        type: 'usdc_purchase_buyer',
        timestamp: new Date(),
        specifier: '2',
        group_id:
          'usdc_purchase_buyer:seller_user_id:1:buyer_user_id:2:content_id:10:content_type:track',
        data: {
          buyer_user_id: 2,
          seller_user_id: 1,
          amount: 1000,
          extra_amount: 0,
          content_id: 10
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
