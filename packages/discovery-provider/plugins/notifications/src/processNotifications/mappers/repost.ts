import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  RepostNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { logger } from '../../logger'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

type RepostNotificationRow = Omit<NotificationRow, 'data'> & {
  data: RepostNotification
}
export class Repost extends BaseNotification<RepostNotificationRow> {
  receiverUserId: number
  repostItemId: number
  repostType: EntityType
  repostUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: RepostNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.repostItemId = this.notification.data.repost_item_id
    this.repostType = this.notification.data.type
    this.repostUserId = this.notification.data.user_id
  }

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.repostUserId])
    const users = res.reduce(
      (acc, user) => {
        acc[user.user_id] = {
          name: user.name,
          isDeactivated: user.is_deactivated
        }
        return acc
      },
      {} as Record<number, { name: string; isDeactivated: boolean }>
    )

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId, this.repostUserId]
    )
    const reposterUserName = users[this.repostUserId]?.name
    let entityType
    let entityName

    const entities = await this.fetchEntities(
      [this.repostItemId],
      this.repostType
    )
    if (this.repostType === EntityType.Track) {
      entityType = EntityType.Track
      entityName = (entities[this.repostItemId] as { title: string })?.title
    } else {
      const playlist = entities[this.repostItemId] as {
        is_album: boolean
        playlist_name: string
      }
      entityType = playlist?.is_album ? EntityType.Album : EntityType.Playlist
      entityName = playlist?.playlist_name
    }

    const title = 'New Repost'
    const body = `${reposterUserName} reposted your ${entityType.toLowerCase()} ${entityName}`
    if (
      userNotificationSettings.isNotificationTypeBrowserEnabled(
        this.receiverUserId,
        'reposts'
      )
    ) {
      await sendBrowserNotification(
        isBrowserPushEnabled,
        userNotificationSettings,
        this.receiverUserId,
        title,
        body
      )
    }

    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.repostUserId,
        receiverUserId: this.receiverUserId
      }) &&
      userNotificationSettings.isNotificationTypeEnabled(
        this.receiverUserId,
        'reposts'
      )
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.receiverUserId
      )
      // If the user's settings for the follow notification is set to true, proceed

      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.receiverUserId) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                userIds: [this.repostUserId],
                type: 'Repost'
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.receiverUserId)
    }
    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        initiatorUserId: this.repostUserId,
        receiverUserId: this.receiverUserId,
        frequency: 'live'
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: this.receiverUserId,
        ...this.notification
      }
      await sendNotificationEmail({
        userId: this.receiverUserId,
        email: userNotificationSettings.getUserEmail(this.receiverUserId),
        frequency: 'live',
        notifications: [notification],
        dnDb: this.dnDB,
        identityDb: this.identityDB
      })
    }
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    const playlists = new Set<number>()
    if (this.repostType === EntityType.Track) {
      tracks.add(this.repostItemId)
    } else {
      playlists.add(this.repostItemId)
    }

    return {
      users: new Set([this.receiverUserId, this.repostUserId]),
      tracks,
      playlists
    }
  }

  formatEmailProps(
    resources: Resources,
    additionalGroupNotifications: Repost[] = []
  ) {
    const user = resources.users[this.repostUserId]
    const additionalUsers = additionalGroupNotifications.map(
      (repost) => resources.users[repost.repostUserId]
    )
    let entity
    if (this.repostType === EntityType.Track) {
      const track = resources.tracks[this.repostItemId]
      entity = {
        type: EntityType.Track,
        name: track.title,
        imageUrl: track.imageUrl
      }
    } else {
      const playlist = resources.playlists[this.repostItemId]
      entity = {
        type: EntityType.Playlist,
        name: playlist.playlist_name,
        imageUrl: playlist.imageUrl
      }
    }
    return {
      type: this.notification.type,
      users: [user, ...additionalUsers],
      entity
    }
  }
}
