import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import {
  USDCPurchaseBuyerNotification,
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
import { email } from '../../email/notifications/preRendered/purchase'
import { logger } from '../../logger'

type USDCPurchaseBuyerRow = Omit<NotificationRow, 'data'> & {
  data: USDCPurchaseBuyerNotification
}
export class USDCPurchaseBuyer extends BaseNotification<USDCPurchaseBuyerRow> {
  notificationReceiverUserId: number
  sellerUserId: number
  amount: string
  contentId: number
  extraAmount: string
  totalAmount: string

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: USDCPurchaseBuyerRow
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
    this.sellerUserId = this.notification.data.seller_user_id
    this.notificationReceiverUserId = this.notification.data.buyer_user_id
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
      this.sellerUserId
    ])
    if (users?.[this.notificationReceiverUserId]?.is_deactivated) {
      return
    }
    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.notificationReceiverUserId, this.sellerUserId]
    )

    const tracks = await this.fetchEntities([this.contentId], EntityType.Track)
    const track = tracks[this.contentId]
    if (!('title' in track)) {
      logger.error(`Missing title in track ${track}`)
      return
    }

    const purchasedTrackName = track.title
    const sellerUsername = users[this.sellerUserId]?.name
    const purchaserUsername = users[this.notificationReceiverUserId]?.name

    const title = 'Purchase Successful'
    const body = `You just purchased ${purchasedTrackName} from ${capitalize(
      sellerUsername
    )}!`
    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.notificationReceiverUserId,
      title,
      body
    )
    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        receiverUserId: this.notificationReceiverUserId,
        initiatorUserId: this.sellerUserId
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
              body,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'USDCPurchaseBuyer',
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
        initiatorUserId: this.sellerUserId,
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
        purchaserName: purchaserUsername,
        artistName: sellerUsername,
        trackTitle: purchasedTrackName,
        trackLink: `https://audius.co${track.permalink}`,
        trackImage: `https://creatornode.audius.co/${track.cover_art_sizes}/480x480.jpg`,
        price: this.amount,
        payExtra: this.extraAmount,
        total: this.totalAmount
      }),
      subject: 'Thank You For Your Support'
    })
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    tracks.add(this.contentId)
    return {
      users: new Set([this.notificationReceiverUserId, this.sellerUserId]),
      tracks
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.sellerUserId]
    const track = resources.tracks[this.contentId]
    const entity = {
      type: EntityType.Track,
      name: track.title,
      imageUrl: track.imageUrl
    }
    return {
      type: this.notification.type,
      users: [user],
      amount: this.amount,
      entity
    }
  }
}
