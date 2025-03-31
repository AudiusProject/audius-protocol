import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  RepostOfRepostNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import { capitalize } from 'lodash'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

type RepostOfRepostNotificationRow = Omit<NotificationRow, 'data'> & {
  data: RepostOfRepostNotification
}
export class RepostOfRepost extends BaseNotification<RepostOfRepostNotificationRow> {
  receiverUserId: number
  repostOfRepostItemId: number
  repostOfreposttype: EntityType
  repostOfRepostUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: RepostOfRepostNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.repostOfRepostItemId = this.notification.data.repost_of_repost_item_id
    this.repostOfreposttype = this.notification.data.type
    this.repostOfRepostUserId = this.notification.data.user_id
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
      .whereIn('user_id', [this.receiverUserId, this.repostOfRepostUserId])
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
      [this.receiverUserId, this.repostOfRepostUserId]
    )
    const reposterUserName = users[this.repostOfRepostUserId]?.name
    let entityType
    let entityName
    const entityId = this.repostOfRepostItemId

    if (this.repostOfreposttype === EntityType.Track) {
      const res: Array<{ track_id: number; title: string }> = await this.dnDB
        .select('track_id', 'title')
        .from<TrackRow>('tracks')
        .where('is_current', true)
        .whereIn('track_id', [this.repostOfRepostItemId])
      const tracks = res.reduce(
        (acc, track) => {
          acc[track.track_id] = { title: track.title }
          return acc
        },
        {} as Record<number, { title: string }>
      )

      entityType = EntityType.Track
      entityName = tracks[this.repostOfRepostItemId]?.title
    } else {
      const res: Array<{
        playlist_id: number
        playlist_name: string
        is_album: boolean
      }> = await this.dnDB
        .select('playlist_id', 'playlist_name', 'is_album')
        .from<PlaylistRow>('playlists')
        .where('is_current', true)
        .whereIn('playlist_id', [this.repostOfRepostItemId])
      const playlists = res.reduce(
        (acc, playlist) => {
          acc[playlist.playlist_id] = {
            playlist_name: playlist.playlist_name,
            is_album: playlist.is_album
          }
          return acc
        },
        {} as Record<number, { playlist_name: string; is_album: boolean }>
      )
      const playlist = playlists[this.repostOfRepostItemId]
      entityType = playlist?.is_album ? EntityType.Album : EntityType.Playlist
      entityName = playlist?.playlist_name
    }

    const title = 'New Repost'
    const body = `${reposterUserName} reposted your repost of ${entityName}`
    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.receiverUserId,
      title,
      body
    )

    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.repostOfRepostUserId,
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
      // If the user's settings for the reposts notification is set to true, proceed
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
                userIds: [this.repostOfRepostUserId],
                type: 'RepostOfRepost',
                entityType: capitalize(entityType),
                entityId
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
        initiatorUserId: this.repostOfRepostUserId,
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
    if (this.repostOfreposttype === EntityType.Track) {
      tracks.add(this.repostOfRepostItemId)
    } else {
      playlists.add(this.repostOfRepostItemId)
    }

    return {
      users: new Set([this.receiverUserId, this.repostOfRepostUserId]),
      tracks,
      playlists
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.repostOfRepostUserId]
    let entity
    if (this.repostOfreposttype === EntityType.Track) {
      const track = resources.tracks[this.repostOfRepostItemId]
      entity = {
        type: EntityType.Track,
        name: track.title,
        image: track.imageUrl
      }
    } else {
      const playlist = resources.playlists[this.repostOfRepostItemId]
      entity = {
        type: EntityType.Playlist,
        name: playlist.playlist_name,
        image: playlist.imageUrl
      }
    }
    return {
      type: this.notification.type,
      users: [{ name: user.name, image: user.imageUrl }],
      entity
    }
  }
}
