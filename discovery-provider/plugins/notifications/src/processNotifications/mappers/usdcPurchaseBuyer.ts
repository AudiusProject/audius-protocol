import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import {
  USDCPurchaseBuyerNotification,
  AppEmailNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { capitalize } from 'lodash'
import { sendBrowserNotification } from '../../web'
import { EntityType } from '../../email/notifications/types'
import { formatUSDCWeiToUSDString } from '../../utils/format'

type USDCPurchaseBuyerRow = Omit<NotificationRow, 'data'> & {
  data: USDCPurchaseBuyerNotification
}
export class USDCPurchaseBuyer extends BaseNotification<USDCPurchaseBuyerRow> {
  notificationReceiverUserId: number
  sellerUserId: number
  amount: string
  content_id: number

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
    this.sellerUserId = this.notification.data.seller_user_id
    this.notificationReceiverUserId = this.notification.data.buyer_user_id
    this.content_id = this.notification.data.content_id
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

    const tracks = await this.fetchEntities([this.content_id], EntityType.Track)
    let purchasedTrackName
    if ('title' in tracks[this.content_id]) {
      purchasedTrackName = (tracks[this.content_id] as { title: string }).title
    }
    const sellerUsername = users[this.sellerUserId]?.name

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
                entityId: this.content_id
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
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    tracks.add(this.content_id)
    return {
      users: new Set([this.notificationReceiverUserId, this.sellerUserId]),
      tracks
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.sellerUserId]
    const track = resources.tracks[this.content_id]
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
