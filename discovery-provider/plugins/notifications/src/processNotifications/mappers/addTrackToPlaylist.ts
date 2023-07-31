import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  AddTrackToPlaylistNotification
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
import { logger } from '../../logger'

type AddTrackToPlaylistNotificationRow = Omit<NotificationRow, 'data'> & {
  data: AddTrackToPlaylistNotification
}

type Track = {
  time: number;
  track: number;
};

type PlaylistContents = {
  track_ids: Track[];
};

export class AddTrackToPlaylist extends BaseNotification<AddTrackToPlaylistNotificationRow> {
  trackId: number
  playlistId: number
  receiverUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: AddTrackToPlaylistNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds![0]
    this.trackId = notification.data.track_id
    this.playlistId = notification.data.playlist_id
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
      .where('is_current', true)
      .whereIn('track_id', [this.trackId])
    const track = trackRes[0]
    const playlistRes: Array<{
      playlist_id: number
      playlist_name: string
      playlist_owner_id: number,
      playlist_contents: PlaylistContents,
    }> = await this.dnDB
      .select('playlist_id', 'playlist_name', 'playlist_owner_id', 'playlist_contents')
      .from<PlaylistRow>('playlists')
      .whereIn("is_current", ["true", "false"])
      .orderBy("blocknumber", "desc")
      .limit(2)
      .whereIn('playlist_id', [this.playlistId])
    const [playlist, old_playlist] = playlistRes

    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [track.owner_id, playlist.playlist_owner_id])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = {
        name: user.name,
        isDeactivated: user.is_deactivated
      }
      return acc
    }, {} as Record<number, { name: string; isDeactivated: boolean }>)

    if (users?.[track.owner_id]?.isDeactivated) {
      return
    }

    if (old_playlist !== undefined) {
      // playlist update happened, not create
      const old_track_ids = old_playlist.playlist_contents.track_ids.map((track) => track.track)
      if (old_track_ids.includes(track.track_id)) {
        logger.info(`playlist update, skipping push ${track} ${playlist.playlist_name}`)
        // track was already present on playlist
        return
      }
    }

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [track.owner_id]
    )

    const playlistOwnerName = users[playlist.playlist_owner_id]?.name
    const trackTitle = track.title
    const playlistName = playlist.playlist_name

    const title = 'Your track got on a playlist! 💿'
    const body = `${playlistOwnerName} added ${trackTitle} to their playlist ${playlistName}`
    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      track.owner_id,
      title,
      body
    )

    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        receiverUserId: track.owner_id
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        track.owner_id
      )
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(track.owner_id) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body,
              data: {
                type: 'AddTrackToPlaylist',
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
      await this.incrementBadgeCount(track.owner_id)
    }
    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        receiverUserId: track.owner_id,
        frequency: 'live'
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: track.owner_id,
        ...this.notification
      }
      await sendNotificationEmail({
        userId: track.owner_id,
        email: userNotificationSettings.getUserEmail(track.owner_id),
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
