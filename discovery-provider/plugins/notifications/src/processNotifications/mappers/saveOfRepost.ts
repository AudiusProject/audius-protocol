import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import { SaveOfRepostNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'

type SaveOfRepostNotificationRow = Omit<NotificationRow, 'data'> & {
  data: SaveOfRepostNotification
}
export class SaveOfRepost extends BaseNotification<SaveOfRepostNotificationRow> {
  receiverUserId: number
  saveOfRepostItemId: number
  saveOfRepostType: EntityType
  saveOfRepostUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: SaveOfRepostNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.saveOfRepostItemId = this.notification.data.save_of_repost_item_id
    this.saveOfRepostType = this.notification.data.type
    this.saveOfRepostUserId = this.notification.data.user_id
  }

  async pushNotification() {
    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.saveOfRepostUserId])
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

    const userNotifications = await super.getShouldSendNotification(
      this.receiverUserId
    )
    const saveOfRepostUserName = users[this.saveOfRepostUserId]?.name
    let entityType
    let entityName

    if (this.saveOfRepostType === EntityType.Track) {
      const res: Array<{ track_id: number; title: string }> = await this.dnDB
        .select('track_id', 'title')
        .from<TrackRow>('tracks')
        .where('is_current', true)
        .whereIn('track_id', [this.saveOfRepostItemId])
      const tracks = res.reduce((acc, track) => {
        acc[track.track_id] = { title: track.title }
        return acc
      }, {} as Record<number, { title: string }>)

      entityType = EntityType.Track
      entityName = tracks[this.saveOfRepostItemId]?.title
    } else {
      const res: Array<{
        playlist_id: number
        playlist_name: string
        is_album: boolean
      }> = await this.dnDB
        .select('playlist_id', 'playlist_name', 'is_album')
        .from<PlaylistRow>('playlists')
        .where('is_current', true)
        .whereIn('playlist_id', [this.saveOfRepostItemId])
      const playlists = res.reduce((acc, playlist) => {
        acc[playlist.playlist_id] = {
          playlist_name: playlist.playlist_name,
          is_album: playlist.is_album
        }
        return acc
      }, {} as Record<number, { playlist_name: string; is_album: boolean }>)
      const playlist = playlists[this.saveOfRepostItemId]
      entityType = playlist?.is_album ? EntityType.Album : EntityType.Playlist
      entityName = playlist?.playlist_name
    }

    // If the user has devices to the notification to, proceed
    if (
      (userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length >
      0
    ) {
      const userMobileSettings: NotificationSettings =
        userNotifications.mobile?.[this.receiverUserId].settings
      const devices: Device[] =
        userNotifications.mobile?.[this.receiverUserId].devices
      // If the user's settings for the reposts notification is set to true, proceed
      if (userMobileSettings['favorites']) {
        await Promise.all(
          devices.map((device) => {
            return sendPushNotification(
              {
                type: device.type,
                badgeCount:
                  userNotifications.mobile[this.receiverUserId].badgeCount,
                targetARN: device.awsARN
              },
              {
                title: 'New Favorite',
                body: `${saveOfRepostUserName} favorited your repost of ${entityName}`,
                data: {}
              }
            )
          })
        )
        // TODO: increment badge count
      }
    }
    //

    if (userNotifications.browser) {
      // TODO: Send out browser
    }
    if (userNotifications.email) {
      // TODO: Send out email
    }
  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    const playlists = new Set<number>()
    if (this.saveOfRepostType === EntityType.Track) {
      tracks.add(this.saveOfRepostItemId)
    } else {
      playlists.add(this.saveOfRepostItemId)
    }

    return {
      users: new Set([this.receiverUserId, this.saveOfRepostUserId]),
      tracks,
      playlists
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.saveOfRepostUserId]
    let entity
    if (this.saveOfRepostType === EntityType.Track) {
      const track = resources.tracks[this.saveOfRepostItemId]
      entity = {
        type: EntityType.Track,
        name: track.title,
        image: track.imageUrl
      }
    } else {
      const playlist = resources.playlists[this.saveOfRepostItemId]
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
