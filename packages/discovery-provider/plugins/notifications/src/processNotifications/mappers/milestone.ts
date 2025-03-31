import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  FollowerMilestoneNotification,
  ListenCountMilestoneNotifications,
  MilestoneType,
  PlaylistMilestoneNotification,
  TrackMilestoneNotification
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

type MilestoneRow = Omit<NotificationRow, 'data'> & {
  data:
    | FollowerMilestoneNotification
    | TrackMilestoneNotification
    | PlaylistMilestoneNotification
}

export class Milestone extends BaseNotification<MilestoneRow> {
  receiverUserId: number
  threshold: number
  type: MilestoneType

  constructor(dnDB: Knex, identityDB: Knex, notification: MilestoneRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.type = this.notification.data.type
    this.threshold = this.notification.data.threshold
  }

  parseIdFromGroupId() {
    const groupId = this.notification.group_id
    const parts = groupId.split(':')
    const id = parts[3]
    return id
  }

  getPushBodyText(entityName?: string, isAlbum?: boolean) {
    if (this.type === MilestoneType.FOLLOWER_COUNT) {
      return `You have reached over ${this.threshold.toLocaleString()} Followers`
    } else if (this.type === MilestoneType.LISTEN_COUNT) {
      return `Your track ${entityName} has reached over ${this.threshold.toLocaleString()} listens`
    } else if (this.type === MilestoneType.TRACK_REPOST_COUNT) {
      return `Your track ${entityName} has reached over ${this.threshold.toLocaleString()} reposts`
    } else if (this.type === MilestoneType.TRACK_SAVE_COUNT) {
      return `Your track ${entityName} has reached over ${this.threshold.toLocaleString()} favorites`
    } else if (this.type === MilestoneType.PLAYLIST_REPOST_COUNT) {
      return `Your ${
        isAlbum ? 'album' : 'playlist'
      } ${entityName} has reached over ${this.threshold.toLocaleString()} reposts`
    } else if (this.type === MilestoneType.PLAYLIST_SAVE_COUNT) {
      return `Your ${
        isAlbum ? 'album' : 'playlist'
      } ${entityName} has reached over ${this.threshold.toLocaleString()} favorites`
    }
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
      .whereIn('user_id', [this.receiverUserId])
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

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId]
    )
    let entityName
    let isAlbum = false

    if (
      this.type === MilestoneType.LISTEN_COUNT ||
      this.type === MilestoneType.TRACK_REPOST_COUNT ||
      this.type === MilestoneType.TRACK_SAVE_COUNT
    ) {
      const id = this.parseIdFromGroupId()
      const res: Array<{ track_id: number; title: string }> = await this.dnDB
        .select('track_id', 'title')
        .from<TrackRow>('tracks')
        .where('is_current', true)
        .whereIn('track_id', [id])
      const tracks = res.reduce(
        (acc, track) => {
          acc[track.track_id] = { title: track.title }
          return acc
        },
        {} as Record<number, { title: string }>
      )

      entityName = tracks[id]?.title
    } else if (
      this.type === MilestoneType.PLAYLIST_REPOST_COUNT ||
      this.type === MilestoneType.PLAYLIST_SAVE_COUNT
    ) {
      const id = this.parseIdFromGroupId()
      const res: Array<{
        playlist_id: number
        playlist_name: string
        is_album: boolean
      }> = await this.dnDB
        .select('playlist_id', 'playlist_name', 'is_album')
        .from<PlaylistRow>('playlists')
        .where('is_current', true)
        .whereIn('playlist_id', [id])
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
      const playlist = playlists[id]
      entityName = playlist?.playlist_name
      isAlbum = playlist?.is_album
    }

    const title = 'Congratulations! 🎉'
    const body = this.getPushBodyText(entityName, isAlbum)
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
        receiverUserId: this.receiverUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.receiverUserId
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
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                ...this.getPushData()
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

  getPushData() {
    switch (this.type) {
      case MilestoneType.FOLLOWER_COUNT:
        return { type: 'MilestoneFollow', initiator: this.receiverUserId }
      case MilestoneType.LISTEN_COUNT:
        return {
          type: 'MilestoneListen',
          entityId: this.parseIdFromGroupId(),
          actions: [{ actionEntityType: 'Track' }]
        }
      case MilestoneType.PLAYLIST_REPOST_COUNT:
        return {
          type: 'MilestoneRepost',
          entityId: this.parseIdFromGroupId(),
          actions: [{ actionEntityType: 'Collection' }]
        }
      case MilestoneType.TRACK_REPOST_COUNT:
        return {
          type: 'MilestoneRepost',
          entityId: this.parseIdFromGroupId(),
          actions: [{ actionEntityType: 'Track' }]
        }
      case MilestoneType.PLAYLIST_SAVE_COUNT:
        return {
          type: 'MilestoneFavorite',
          entityId: this.parseIdFromGroupId(),
          actions: [{ actionEntityType: 'Collection' }]
        }
      case MilestoneType.TRACK_SAVE_COUNT:
        return {
          type: 'MilestoneFavorite',
          entityId: this.parseIdFromGroupId(),
          actions: [{ actionEntityType: 'Track' }]
        }
    }
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    const playlists = new Set<number>()
    if (
      this.type === MilestoneType.TRACK_REPOST_COUNT ||
      this.type === MilestoneType.TRACK_SAVE_COUNT
    ) {
      const data = this.notification.data as TrackMilestoneNotification
      tracks.add(data.track_id)
    } else if (
      this.type === MilestoneType.PLAYLIST_REPOST_COUNT ||
      this.type === MilestoneType.PLAYLIST_SAVE_COUNT
    ) {
      const data = this.notification.data as PlaylistMilestoneNotification
      playlists.add(data.playlist_id)
    } else if (this.type === MilestoneType.LISTEN_COUNT) {
      const data = this.notification.data as ListenCountMilestoneNotifications
      tracks.add(data.track_id)
    }
    return {
      users: new Set([this.receiverUserId]),
      tracks,
      playlists
    }
  }

  formatEmailProps(resources: Resources) {
    const receiverUser = resources.users[this.receiverUserId]
    let achievement
    let entity
    if (this.type === MilestoneType.FOLLOWER_COUNT) {
      achievement = 'follow'
    } else if (this.type === MilestoneType.LISTEN_COUNT) {
      const data = this.notification.data as TrackMilestoneNotification
      const track = resources.tracks[data.track_id]
      achievement = 'listen'
      entity = {
        type: EntityType.Track,
        name: track.title,
        imageUrl: track.imageUrl
      }
    } else if (this.type === MilestoneType.TRACK_REPOST_COUNT) {
      const data = this.notification.data as TrackMilestoneNotification
      const track = resources.tracks[data.track_id]
      achievement = 'repost'
      entity = {
        type: EntityType.Track,
        name: track.title,
        imageUrl: track.imageUrl
      }
    } else if (this.type === MilestoneType.TRACK_SAVE_COUNT) {
      const data = this.notification.data as TrackMilestoneNotification
      const track = resources.tracks[data.track_id]
      achievement = 'favorite'
      entity = {
        type: EntityType.Track,
        name: track.title,
        imageUrl: track.imageUrl
      }
    } else if (this.type === MilestoneType.PLAYLIST_REPOST_COUNT) {
      const data = this.notification.data as PlaylistMilestoneNotification
      const playlist = resources.playlists[data.playlist_id]
      entity = {
        type: playlist.is_album ? EntityType.Album : EntityType.Playlist,
        name: playlist.playlist_name,
        imageUrl: playlist.imageUrl
      }
      achievement = 'repost'
    } else if (this.type === MilestoneType.PLAYLIST_SAVE_COUNT) {
      const data = this.notification.data as PlaylistMilestoneNotification
      const playlist = resources.playlists[data.playlist_id]
      achievement = 'favorite'
      entity = {
        type: playlist.is_album ? EntityType.Album : EntityType.Playlist,
        name: playlist.playlist_name,
        imageUrl: playlist.imageUrl
      }
    }

    return {
      type: 'milestone',
      achievement,
      entity,
      value: this.threshold
    }
  }
}
