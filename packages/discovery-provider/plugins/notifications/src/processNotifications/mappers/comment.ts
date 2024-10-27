import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  CommentNotification
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
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

type CommentNotificationRow = Omit<NotificationRow, 'data'> & {
  data: CommentNotification
}
export class Comment extends BaseNotification<CommentNotificationRow> {
  receiverUserId: number
  entityId: number
  entityType: EntityType
  commenterUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: CommentNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.entityId = this.notification.data.entity_id
    this.entityType = this.notification.data.type.toLowerCase() as EntityType
    this.commenterUserId = this.notification.data.comment_user_id
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
      .whereIn('user_id', [this.receiverUserId, this.commenterUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = {
        name: user.name,
        isDeactivated: user.is_deactivated
      }
      return acc
    }, {} as Record<number, { name: string; isDeactivated: boolean }>)

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    const commenterUserName = users[this.commenterUserId]?.name
    let entityType
    let entityName

    if (this.entityType === EntityType.Track) {
      const res: Array<{ track_id: number; title: string }> = await this.dnDB
        .select('track_id', 'title')
        .from<TrackRow>('tracks')
        .where('is_current', true)
        .whereIn('track_id', [this.entityId])
      const tracks = res.reduce((acc, track) => {
        acc[track.track_id] = { title: track.title }
        return acc
      }, {} as Record<number, { title: string }>)

      entityType = 'track'
      entityName = tracks[this.entityId]?.title
    }

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId, this.commenterUserId]
    )

    const title = 'New Comment'
    const body = `${commenterUserName} commented on your ${entityType.toLowerCase()} ${entityName}`
    if (
      userNotificationSettings.isNotificationTypeBrowserEnabled(
        this.receiverUserId,
        'comments'
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
        initiatorUserId: this.commenterUserId,
        receiverUserId: this.receiverUserId
      }) &&
      userNotificationSettings.isNotificationTypeEnabled(
        this.receiverUserId,
        'comments'
      )
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.receiverUserId
      )
      // If the user's settings for the follow notification is set to true, proceed
      const timestamp = Math.floor(
        Date.parse(this.notification.timestamp as any as string) / 1000
      )
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
                id: `timestamp:${timestamp}:group_id:${this.notification.group_id}`,
                userIds: [this.commenterUserId],
                type: 'Comment',
                entityType: this.notification.data.type,
                entityId: this.entityId
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
        initiatorUserId: this.commenterUserId,
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
    if (this.entityType === EntityType.Track) {
      tracks.add(this.entityId)
    }

    return {
      users: new Set([this.receiverUserId, this.commenterUserId]),
      tracks
    }
  }

  formatEmailProps(
    resources: Resources,
    additionalGroupNotifications: Comment[] = []
  ) {
    const user = resources.users[this.commenterUserId]
    const additionalUsers = additionalGroupNotifications.map(
      (comment) => resources.users[comment.commenterUserId]
    )
    let entity
    if (this.entityType === EntityType.Track) {
      const track = resources.tracks[this.entityId]
      entity = {
        type: EntityType.Track,
        name: track.title,
        imageUrl: track.imageUrl
      }
    }
    return {
      type: this.notification.type,
      users: [user, ...additionalUsers],
      entity
    }
  }
}
