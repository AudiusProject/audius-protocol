import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { AddTrackToPlaylistdNotification } from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/appNotifications/renderEmail'

type AddTrackToPlaylistdNotificationRow = Omit<NotificationRow, 'data'> & { data: AddTrackToPlaylistdNotification }
export class AddTrackToPlaylistd extends BaseNotification<AddTrackToPlaylistdNotificationRow> {

  trackId: number
  playlistId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: AddTrackToPlaylistdNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.trackId = notification.data.track_id
    this.playlistId = notification.data.playlist_id
  }

  async pushNotification() {

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.senderUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)


    if (users?.[this.senderUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(this.senderUserId)

    // TODO: fetch this info
    const playlistOwnerName = ''
    const trackTitle = ''
    const playlistName = ''

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.senderUserId]?.devices ?? []).length > 0) {
      const devices: Device[] = userNotifications.mobile?.[this.senderUserId].devices
      await Promise.all(devices.map(device => {
        return sendPushNotification({
          type: device.type,
          badgeCount: userNotifications.mobile[this.senderUserId].badgeCount,
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
      users: new Set([this.senderUserId, this.receiverUserId]),
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
