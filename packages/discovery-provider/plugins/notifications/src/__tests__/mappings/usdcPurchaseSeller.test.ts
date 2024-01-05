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

describe('USDC Purchase Seller', () => {
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

  const sendTransactionalEmailSpy = jest
    .spyOn(sendEmailFns, 'sendTransactionalEmail')
    .mockImplementation(() => Promise.resolve(true))

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2020-05-13T12:33:37.000Z'))
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for usdc purchase', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createUSDCPurchase(processor.discoveryDB, [
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.track,
        content_id: 10,
        amount: '1000000',
        extra_amount: '0'
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await setUserEmailAndSettings(processor.identityDB, 'live', 1)

    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(2)
    // Assert single pending
    const title = 'Track Sold'
    const body =
      'Congrats, User_2 just bought your track track_title_10 for $1.00!'
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
          id: 'timestamp:1589373217:group_id:usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:10:content_type:track',
          type: 'USDCPurchaseSeller',
          entityId: 10
        }
      }
    )

    expect(sendEmailNotificationSpy).toHaveBeenCalledWith({
      userId: 1,
      email: 'user_1@gmail.com',
      frequency: 'live',
      notifications: [
        expect.objectContaining({
          specifier: '2',
          group_id:
            'usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:10:content_type:track',
          type: 'usdc_purchase_seller'
        })
      ],
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
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
      subject: 'Your Track Has Been Purchased'
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
        amount: '1000000',
        extra_amount: '0'
      }
    ])

    const notifications: AppEmailNotification[] = [
      {
        type: 'usdc_purchase_seller',
        timestamp: new Date(),
        specifier: '2',
        group_id:
          'usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:10:content_type:track',
        data: {
          buyer_user_id: 2,
          seller_user_id: 1,
          amount: 1000000,
          extra_amount: 0,
          content_id: 10
        },
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
