import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { USDCPurchaseSellerNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { capitalize } from 'lodash'
import { sendBrowserNotification } from '../../web'
import { EntityType } from '../../email/notifications/types'
import {
  formatContentUrl,
  formatImageUrl,
  formatProfileUrl,
  formatUSDCWeiToUSDString
} from '../../utils/format'
import { email } from '../../email/notifications/preRendered/sale'
import { logger } from '../../logger'

type USDCPurchaseSellerRow = Omit<NotificationRow, 'data'> & {
  data: USDCPurchaseSellerNotification
}

const body = (
  buyerUsername: string,
  purchasedContentName: string,
  contentType: string,
  price: string
): string =>
  `Congrats, ${
    capitalize(buyerUsername) || 'someone'
  } just bought your ${contentType} ${purchasedContentName} for $${price}!`
export class USDCPurchaseSeller extends BaseNotification<USDCPurchaseSellerRow> {
  notificationReceiverUserId: number
  buyerUserId: number
  amount: string
  contentId: number
  contentType: string
  extraAmount: string
  totalAmount: string

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: USDCPurchaseSellerRow
  ) {
    super(dnDB, identityDB, notification)
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
    this.contentType = this.notification.data.content_type
  }

  async processNotification({
    isBrowserPushEnabled
  }: {
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

    let purchasedContentName, cover_art_sizes, slug, title
    if (this.contentType === 'track') {
      const tracks = await this.fetchEntities(
        [this.contentId],
        EntityType.Track
      )
      const track = tracks[this.contentId]
      if (!('title' in track)) {
        logger.error(`Missing title in track ${track}`)
        return
      }
      title = 'Track Sold'
      purchasedContentName = track.title
      cover_art_sizes = track.cover_art_sizes
      slug = track.slug
    } else {
      const albums = await this.fetchEntities(
        [this.contentId],
        EntityType.Album
      )
      const album = albums[this.contentId]
      if (!('playlist_name' in album)) {
        logger.error(`Missing title in album ${album}`)
        return
      }
      title = 'Album Sold'
      purchasedContentName = album.playlist_name
      cover_art_sizes = album.playlist_image_sizes_multihash
      slug = `album/${album.slug}`
    }

    const buyerUsername = users[this.buyerUserId]?.name
    const buyerHandle = users[this.buyerUserId]?.handle
    const sellerUsername = users[this.notificationReceiverUserId]?.name
    const sellerHandle = users[this.notificationReceiverUserId]?.handle
    const sellerProfilePictureSizes =
      users[this.notificationReceiverUserId]?.profile_picture_sizes
    const price = this.totalAmount

    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.notificationReceiverUserId,
      title,
      body(buyerUsername, purchasedContentName, this.contentType, price)
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
              body: body(
                buyerUsername,
                purchasedContentName,
                this.contentType,
                price
              ),
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

    await sendTransactionalEmail({
      email: userNotificationSettings.getUserEmail(
        this.notificationReceiverUserId
      ),
      html: email({
        purchaserName: buyerUsername,
        purchaserLink: formatProfileUrl(buyerHandle),
        artistName: sellerUsername,
        artistHandle: sellerHandle,
        contentType: this.contentType,
        contentTitle: purchasedContentName,
        contentLink: formatContentUrl(sellerHandle, slug),
        contentImage: formatImageUrl(cover_art_sizes, 480),
        artistImage: formatImageUrl(sellerProfilePictureSizes, 150),
        artistLink: formatProfileUrl(sellerHandle),
        price: this.amount,
        payExtra: this.extraAmount,
        total: this.totalAmount
      }),
      subject: `Congrats! You've made a sale on Audius!`
    })
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    const albums = new Set<number>()
    if (this.contentType === 'track') {
      tracks.add(this.contentId)
    } else {
      albums.add(this.contentId)
    }
    return {
      users: new Set([this.notificationReceiverUserId, this.buyerUserId]),
      tracks,
      playlists: albums
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.buyerUserId]
    const track = resources.tracks[this.contentId]
    const album = resources.playlists[this.contentId]
    const isTrack = this.contentType === 'track'
    const entity = {
      type: isTrack ? EntityType.Track : EntityType.Album,
      name: isTrack ? track.title : album.playlist_name,
      imageUrl: isTrack ? track.imageUrl : album.imageUrl
    }
    return {
      type: this.notification.type,
      users: [user],
      amount: this.totalAmount,
      entity
    }
  }
}
