import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import {
  USDCPurchaseSellerNotification,
  AppEmailNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import {
  sendNotificationEmail,
  sendTransactionalEmail
} from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { capitalize } from 'lodash'
import { sendBrowserNotification } from '../../web'
import { EntityType } from '../../email/notifications/types'
import { formatUSDCWeiToUSDString } from '../../utils/format'
import { email } from '../../email/notifications/preRendered/sale'

type USDCPurchaseSellerRow = Omit<NotificationRow, 'data'> & {
  data: USDCPurchaseSellerNotification
}

const title = 'Track Sold'
const body = (
  buyerUsername: string,
  purchasedTrackName: string,
  price: string
): string =>
  `Congrats, ${capitalize(
    buyerUsername
  )} just bought your track ${purchasedTrackName} for $${price}!`
export class USDCPurchaseSeller extends BaseNotification<USDCPurchaseSellerRow> {
  notificationReceiverUserId: number
  buyerUserId: number
  amount: string
  contentId: number
  extraAmount: string
  totalAmount: string

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: USDCPurchaseSellerRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.amount = formatUSDCWeiToUSDString(
      this.notification.data.amount.toString()
    )
    this.extraAmount = formatUSDCWeiToUSDString(
      this.notification.data.extra_amount.toString()
    )
    this.totalAmount = formatUSDCWeiToUSDString(
      (
        this.notification.data.amount + this.notification.data.extra_amount
      ).toString()
    )
    this.buyerUserId = this.notification.data.buyer_user_id
    this.notificationReceiverUserId = this.notification.data.seller_user_id
    this.contentId = this.notification.data.content_id
  }

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    const users = await this.getUsersBasicInfo([
      this.notificationReceiverUserId,
      this.buyerUserId
    ])
    if (users?.[this.notificationReceiverUserId]?.is_deactivated) {
      return
    }
    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.notificationReceiverUserId, this.buyerUserId]
    )

    const tracks = await this.fetchEntities([this.contentId], EntityType.Track)
    let purchasedTrackName
    if ('title' in tracks[this.contentId]) {
      purchasedTrackName = (tracks[this.contentId] as { title: string }).title
    }
    const buyerUsername = users[this.buyerUserId]?.name
    const sellerUsername = users[this.notificationReceiverUserId]?.name
    const price = this.amount

    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.notificationReceiverUserId,
      title,
      body(buyerUsername, purchasedTrackName, price)
    )
    if (
      userNotificationSettings.shouldSendPushNotification({
        receiverUserId: this.notificationReceiverUserId,
        initiatorUserId: this.buyerUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.notificationReceiverUserId
      )
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(
                  this.notificationReceiverUserId
                ) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body: body(buyerUsername, purchasedTrackName, price),
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'USDCPurchaseSeller',
                entityId: this.contentId
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.notificationReceiverUserId)
    }

    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        initiatorUserId: this.buyerUserId,
        receiverUserId: this.notificationReceiverUserId,
        frequency: 'live'
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: this.notificationReceiverUserId,
        ...this.notification
      }
      await sendNotificationEmail({
        userId: this.notificationReceiverUserId,
        email: userNotificationSettings.getUserEmail(
          this.notificationReceiverUserId
        ),
        frequency: 'live',
        notifications: [notification],
        dnDb: this.dnDB,
        identityDb: this.identityDB
      })
    }

    await sendTransactionalEmail({
      email: userNotificationSettings.getUserEmail(
        this.notificationReceiverUserId
      ),
      html: email({
        purchaserName: buyerUsername,
        artistName: sellerUsername,
        trackTitle: purchasedTrackName,
        price: this.amount,
        payExtra: this.extraAmount,
        total: this.totalAmount
      }),
      subject: 'Your Track Has Been Purchased'
    })
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    tracks.add(this.contentId)
    return {
      users: new Set([this.notificationReceiverUserId, this.buyerUserId]),
      tracks
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.buyerUserId]
    const track = resources.tracks[this.contentId]
    const entity = {
      type: EntityType.Track,
      name: track.title,
      imageUrl: track.imageUrl
    }
    return {
      type: this.notification.type,
      users: [user],
      // TODO : convert this amount w/ right precision
      amount: this.amount,
      entity
    }
  }
}
