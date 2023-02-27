import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import { AddTrackToPlaylistNotification } from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

type AddTrackToPlaylistNotificationRow = Omit<NotificationRow, 'data'> & { data: AddTrackToPlaylistNotification }
export class AddTrackToPlaylist extends BaseNotification<AddTrackToPlaylistNotificationRow> {

  trackId: number
  playlistId: number
  receiverUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: AddTrackToPlaylistNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds![0]
    this.trackId = notification.data.track_id
    this.playlistId = notification.data.playlist_id
  }

  async pushNotification() {
    const trackRes: Array<{ track_id: number, title: string, owner_id: number }> = await this.dnDB.select('track_id', 'title', 'owner_id')
      .from<TrackRow>('tracks')
      .where('is_current', true)
      .whereIn('track_id', [this.trackId])
    const track = trackRes[0]
    const playlistRes: Array<{ playlist_id: number, playlist_name: string, playlist_owner_id: number }> = await this.dnDB.select('playlist_id', 'playlist_name', 'playlist_owner_id')
      .from<PlaylistRow>('playlists')
      .where('is_current', true)
      .whereIn('playlist_id', [this.playlistId])
    const playlist = playlistRes[0]

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [track.owner_id, playlist.playlist_owner_id])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)


    if (users?.[track.owner_id]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(track.owner_id)

    const playlistOwnerName = users[playlist.playlist_owner_id]?.name
    const trackTitle = track.title
    const playlistName = playlist.playlist_name

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[track.owner_id]?.devices ?? []).length > 0) {
      const devices: Device[] = userNotifications.mobile?.[track.owner_id].devices
      await Promise.all(devices.map(device => {
        return sendPushNotification({
          type: device.type,
          badgeCount: userNotifications.mobile[track.owner_id].badgeCount,
          targetARN: device.awsARN
        }, {
          title: 'Your track got on a playlist! 💿',
          body: `${playlistOwnerName} added ${trackTitle} to their playlist ${playlistName}`,
          data: {}
        })
      }))
      // TODO: increment badge count

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
    return {
      users: new Set([this.receiverUserId]),
      tracks: new Set([this.trackId]),
      playlists: new Set([this.playlistId]),
    }
  }

  formatEmailProps(resources: Resources) {
    const receiverUserId = resources.users[this.receiverUserId]
    return {
      type: this.notification.type,
      receiverUserId: { name: receiverUserId.name },
    }
  }

}
