import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  CommentReactionNotification
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

type CommentReactionNotificationRow = Omit<NotificationRow, 'data'> & {
  data: CommentReactionNotification
}
export class CommentReaction extends BaseNotification<CommentReactionNotificationRow> {
  receiverUserId: number
  entityId: number
  entityType: EntityType
  entityUserId: number
  reacterUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: CommentReactionNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.entityId = this.notification.data.entity_id
    this.entityType = this.notification.data.type.toLowerCase() as EntityType
    this.entityUserId = this.notification.data.entity_user_id
    this.reacterUserId = this.notification.data.reacter_user_id
  }

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    let entityType: string
    let entityName: string

    if (this.entityType === EntityType.Track) {
      const [track] = await this.dnDB
        .select('track_id', 'title')
        .from<TrackRow>('tracks')
        .where('is_current', true)
        .where('track_id', this.entityId)

      if (track) {
        const { title } = track
        entityType = 'track'
        entityName = title
      }
    }

    const users = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [
        this.receiverUserId,
        this.reacterUserId,
        this.entityUserId
      ])
      .then((rows) =>
        rows.reduce((acc, row) => {
          acc[row.user_id] = row
          return acc
        }, {} as Record<number, UserRow>)
      )

    if (users[this.receiverUserId]?.is_deactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId, this.reacterUserId]
    )

    const title = 'New Reaction'
    const body = `${users[this.reacterUserId]?.name} liked your comment on ${
      this.entityUserId === this.receiverUserId
        ? 'your'
        : `${users[this.entityUserId]?.name}'s`
    } ${entityType?.toLowerCase()} ${entityName}`
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

    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.reacterUserId,
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
        Date.parse(this.notification.timestamp as unknown as string) / 1000
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
                userIds: [this.reacterUserId],
                type: 'CommentReaction',
                entityType: this.entityType,
                entityId: this.entityId,
                entityUserId: this.entityUserId
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
        initiatorUserId: this.reacterUserId,
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
      users: new Set([
        this.receiverUserId,
        this.reacterUserId,
        this.entityUserId
      ]),
      tracks
    }
  }

  formatEmailProps(
    resources: Resources,
    additionalGroupNotifications: CommentReaction[] = []
  ) {
    const user = resources.users[this.reacterUserId]
    const additionalUsers = additionalGroupNotifications.map(
      (reaction) => resources.users[reaction.reacterUserId]
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
      receiverUserId: this.receiverUserId,
      entityUser: resources.users[this.entityUserId],
      entity
    }
  }
}
