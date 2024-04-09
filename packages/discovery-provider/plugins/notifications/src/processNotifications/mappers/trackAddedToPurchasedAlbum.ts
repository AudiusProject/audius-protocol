import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  TrackAddedToPurchasedAlbumNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

type TrackAddedToPurchasedAlbumNotificationRow = Omit<
  NotificationRow,
  'data'
> & {
  data: TrackAddedToPurchasedAlbumNotification
}
export class TrackAddedToPurchasedAlbum extends BaseNotification<TrackAddedToPurchasedAlbumNotificationRow> {
  trackId: number
  playlistId: number
  playlistOwnerId: number
  receiverUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: TrackAddedToPurchasedAlbumNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds![0]
    this.trackId = notification.data.track_id
    this.playlistId = notification.data.playlist_id
    this.playlistOwnerId = notification.data.playlist_owner_id
  }

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    const trackRes: Array<{
      track_id: number
      title: string
      owner_id: number
    }> = await this.dnDB
      .select('track_id', 'title', 'owner_id')
      .from<TrackRow>('tracks')
      .whereIn('track_id', [this.trackId])
    const track = trackRes[0]
    const playlistRes: Array<{
      playlist_id: number
      playlist_name: string
      playlist_owner_id: number
    }> = await this.dnDB
      .select('playlist_id', 'playlist_name', 'playlist_owner_id')
      .from<PlaylistRow>('playlists')
      .whereIn('playlist_id', [this.playlistId])
    const playlist = playlistRes[0]

    const userRes: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .whereIn('user_id', [playlist.playlist_owner_id])
    const user = userRes[0]

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId]
    )

    const playlistOwnerName = user?.name
    const trackTitle = track.title
    const playlistName = playlist.playlist_name

    const title = 'New Release'
    const body = `${playlistOwnerName} released a new track ${trackTitle} on the album you purchased, ${playlistName}`
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
                type: 'TrackAddedToPurchasedAlbum',
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                playlistId: this.playlistId
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

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.receiverUserId]),
      tracks: new Set([this.trackId]),
      playlists: new Set([this.playlistId])
    }
  }

  formatEmailProps(resources: Resources) {
    const receiverUserId = resources.users[this.receiverUserId]
    const playlist = resources.playlists[this.playlistId]
    const track = resources.tracks[this.trackId]
    return {
      type: this.notification.type,
      receiverUserId: { name: receiverUserId.name },
      playlistOwner: { name: playlist.ownerName },
      playlist: { playlist_name: playlist.playlist_name },
      track: { title: track.title }
    }
  }
}
