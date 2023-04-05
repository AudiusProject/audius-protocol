import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import {
  CreatePlaylistNotification,
  CreateTrackNotification
} from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'

type CreateNotificationRow = Omit<NotificationRow, 'data'> & {
  data: CreateTrackNotification | CreatePlaylistNotification
}
export class Create extends BaseNotification<CreateNotificationRow> {
  receiverUserIds: number[]
  trackId?: number
  playlistId?: number
  isAlbum?: boolean

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: CreateNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserIds = userIds
    if ('track_id' in this.notification.data) {
      this.trackId = this.notification.data.track_id
    }
    if ('playlist_id' in this.notification.data) {
      this.playlistId = this.notification.data.playlist_id
      this.isAlbum = this.notification.data.is_album
    }
  }

  async pushNotification() {
    let track
    let ownerId
    let description
    if (this.trackId) {
      const trackRes: Array<{
        track_id: number
        title: string
        owner_id: number
      }> = await this.dnDB
        .select('track_id', 'title', 'owner_id')
        .from<TrackRow>('tracks')
        .where('is_current', true)
        .whereIn('track_id', [this.trackId])
      track = trackRes[0]
      ownerId = track.owner_id
    }

    let playlist
    if (this.playlistId) {
      const playlistRes: Array<{
        playlist_id: number
        playlist_name: string
        playlist_owner_id: number
      }> = await this.dnDB
        .select('playlist_id', 'playlist_name', 'playlist_owner_id')
        .from<PlaylistRow>('playlists')
        .where('is_current', true)
        .whereIn('playlist_id', [this.playlistId])
      playlist = playlistRes[0]
      ownerId = playlist.playlist_owner_id
    }

    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [ownerId, ...this.receiverUserIds])

    const users = res.reduce((acc, user) => {
      acc[user.user_id] = {
        name: user.name,
        isDeactivated: user.is_deactivated
      }
      return acc
    }, {} as Record<number, { name: string; isDeactivated: boolean }>)

    const userName = users[ownerId]?.name
    if (this.trackId) {
      description = `${userName} released a new track`
    } else {
      description = `${userName} released a new ${this.isAlbum ? 'album' : 'playlist'
        } ${playlist.playlist_name}`
    }

    const validReceiverUserIds = this.receiverUserIds.filter(
      (userId) => !(users?.[userId]?.isDeactivated ?? true)
    )
    for (const userId of validReceiverUserIds) {
      const userNotifications = await super.getUserNotificationSettings(userId)

      // If the user has devices to the notification to, proceed
      if ((userNotifications.mobile?.[userId]?.devices ?? []).length > 0) {
        const devices: Device[] = userNotifications.mobile?.[userId].devices
        // If the user's settings for the follow notification is set to true, proceed

        await Promise.all(
          devices.map((device) => {
            return sendPushNotification(
              {
                type: device.type,
                badgeCount: userNotifications.mobile[userId].badgeCount + 1,
                targetARN: device.awsARN
              },
              {
                title: 'New Artist Update',
                body: description,
                data: {
                  type: 'UserSubscription',
                  id: `timestamp:${this.getNotificationTimestamp()}:group_id:${this.notification.group_id}`,
                }
              }
            )
          })
        )
        await this.incrementBadgeCount(userId)
      }
      if (userNotifications.email) {
        // TODO: Send out email
      }
    }
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    const playlists = new Set<number>()
    if (this.trackId) {
      tracks.add(this.trackId)
    }
    if (this.playlistId) {
      playlists.add(this.playlistId)
    }
    return {
      users: new Set(this.receiverUserIds),
      tracks,
      playlists
    }
  }

  formatEmailProps(
    resources: Resources,
    additionalGroupNotifications?: Create[]
  ) {
    const count = (additionalGroupNotifications ?? []).length + 1
    let entity = {}
    let user
    if (this.trackId) {
      const track = resources.tracks[this.trackId]
      entity = {
        ...track,
        type: EntityType.Track,
        name: track.title,
        count
      }
      user = { name: track.ownerName }
    } else {
      const playlist = resources.playlists[this.playlistId]
      entity = {
        ...playlist,
        type: this.isAlbum ? EntityType.Album : EntityType.Playlist,
        name: playlist.playlist_name
      }
      user = { name: playlist.ownerName }
    }
    return {
      type: this.notification.type,
      entity: entity,
      users: [user]
    }
  }
}
