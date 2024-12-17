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
  createUSDCPurchase,
  createPlaylists
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
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for usdc track purchase', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createUSDCPurchase(processor.discoveryDB, [
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.track,
        content_id: 10,
        amount: '1000000',
        extra_amount: '0',
        splits: JSON.stringify([
          {
            user_id: 1,
            amount: 1000000,
            percentage: 100
          }
        ])
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

    expect(sendEmailNotificationSpy).not.toHaveBeenCalledWith({
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
      subject: "Congrats! You've made a sale on Audius!"
    })
  })

  test('Process push notification for guest usdc track purchase', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2, handle: '', name: '' }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createUSDCPurchase(processor.discoveryDB, [
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.track,
        content_id: 10,
        amount: '1000000',
        extra_amount: '0',
        splits: JSON.stringify([
          {
            user_id: 1,
            amount: 1000000,
            percentage: 100
          }
        ])
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
      'Congrats, someone just bought your track track_title_10 for $1.00!'

    await processor.appNotificationsProcessor.process(pending.appNotifications)
    expect(sendPushNotificationSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        body
      })
    )

    expect(sendEmailNotificationSpy).not.toHaveBeenCalledWith({
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
      subject: "Congrats! You've made a sale on Audius!"
    })
  })

  test('Process push notification for usdc album purchase', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }, { user_id: 2 }])
    await createPlaylists(processor.discoveryDB, [
      { playlist_id: 15, playlist_owner_id: 1 }
    ])
    await createUSDCPurchase(processor.discoveryDB, [
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.album,
        content_id: 15,
        amount: '1000000',
        extra_amount: '0',
        splits: JSON.stringify([
          {
            user_id: 1,
            amount: 1000000,
            percentage: 100
          }
        ])
      }
    ])
    await insertMobileSettings(processor.identityDB, [{ userId: 1 }])
    await insertMobileDevices(processor.identityDB, [{ userId: 1 }])
    await setUserEmailAndSettings(processor.identityDB, 'live', 1)

    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(2)
    // Assert single pending
    const title = 'Album Sold'
    const body =
      'Congrats, User_2 just bought your album playlist_name_15 for $1.00!'
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
          id: 'timestamp:1589373217:group_id:usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:15:content_type:album',
          type: 'USDCPurchaseSeller',
          entityId: 15
        }
      }
    )

    expect(sendEmailNotificationSpy).not.toHaveBeenCalledWith({
      userId: 1,
      email: 'user_1@gmail.com',
      frequency: 'live',
      notifications: [
        expect.objectContaining({
          specifier: '2',
          group_id:
            'usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:15:content_type:album',
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
      subject: "Congrats! You've made a sale on Audius!"
    })
  })

  test('Render emails', async () => {
    await createUsers(processor.discoveryDB, [
      { user_id: 1 },
      { user_id: 2 },
      { user_id: 3, handle: '', name: '' }
    ])
    await createTracks(processor.discoveryDB, [{ track_id: 10, owner_id: 1 }])
    await createPlaylists(processor.discoveryDB, [
      { playlist_id: 15, playlist_owner_id: 1 }
    ])
    await createUSDCPurchase(processor.discoveryDB, [
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.track,
        content_id: 10,
        amount: '1000000',
        extra_amount: '0',
        splits: JSON.stringify([
          {
            user_id: 1,
            amount: 1000000,
            percentage: 100
          }
        ])
      },
      {
        seller_user_id: 1,
        buyer_user_id: 3,
        content_type: usdc_purchase_content_type.track,
        content_id: 10,
        amount: '1000000',
        extra_amount: '0',
        splits: JSON.stringify([
          {
            user_id: 1,
            amount: 1000000,
            percentage: 100
          }
        ])
      },
      {
        seller_user_id: 1,
        buyer_user_id: 2,
        content_type: usdc_purchase_content_type.album,
        content_id: 15,
        amount: '1000000',
        extra_amount: '0',
        splits: JSON.stringify([
          {
            user_id: 1,
            amount: 1000000,
            percentage: 100
          }
        ])
      }
    ])

    const trackNotifications: AppEmailNotification[] = [
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
          content_id: 10,
          content_type: 'track',
          splits: [
            {
              user_id: 1,
              amount: 1000000,
              percentage: 100
            }
          ]
        },
        user_ids: [1],
        receiver_user_id: 1
      },
      {
        type: 'usdc_purchase_seller',
        timestamp: new Date(),
        specifier: '3',
        group_id:
          'usdc_purchase_seller:seller_user_id:1:buyer_user_id:3:content_id:10:content_type:track',
        data: {
          buyer_user_id: 3,
          seller_user_id: 1,
          amount: 1000000,
          extra_amount: 0,
          content_id: 10,
          content_type: 'track',
          splits: [{ user_id: 1, amount: 1000000, percentage: 100 }]
        },
        user_ids: [1],
        receiver_user_id: 1
      }
    ]
    const trackNotificationHtml = await renderEmail({
      userId: 1,
      email: 'joey@audius.co',
      frequency: 'daily',
      notifications: trackNotifications,
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(trackNotificationHtml).toMatchSnapshot()

    const albumNotifications: AppEmailNotification[] = [
      {
        type: 'usdc_purchase_seller',
        timestamp: new Date(),
        specifier: '2',
        group_id:
          'usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:15:content_type:album',
        data: {
          buyer_user_id: 2,
          seller_user_id: 1,
          amount: 1000000,
          extra_amount: 0,
          content_id: 15,
          content_type: 'album',
          splits: [
            {
              user_id: 1,
              amount: 1000000,
              percentage: 100
            }
          ]
        },
        user_ids: [1],
        receiver_user_id: 1
      }
    ]
    const albumNotificationHtml = await renderEmail({
      userId: 1,
      email: 'joey@audius.co',
      frequency: 'daily',
      notifications: albumNotifications,
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(albumNotificationHtml).toMatchSnapshot()
  })
})
