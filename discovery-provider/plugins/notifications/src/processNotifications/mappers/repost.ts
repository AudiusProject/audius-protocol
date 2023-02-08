import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { RepostNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/appNotifications/renderEmail'
import { EntityType } from '../../email/appNotifications/types'

type RepostNotificationRow = Omit<NotificationRow, 'data'> & { data: RepostNotification }
export class Repost extends BaseNotification<RepostNotificationRow> {

  receiverUserId: number
  repostItemId: number
  repostType: EntityType
  repostUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: RepostNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.repostItemId = this.notification.data.repost_item_id
    this.repostType = this.notification.data.type
    this.repostUserId = this.notification.data.user_id
  }

  async pushNotification() {

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.repostUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)


    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    // TODO: Fetch the tracks or playlist

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(this.receiverUserId)

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length > 0) {
      const userMobileSettings: NotificationSettings = userNotifications.mobile?.[this.receiverUserId].settings
      const devices: Device[] = userNotifications.mobile?.[this.receiverUserId].devices
      // If the user's settings for the follow notification is set to true, proceed
      if (userMobileSettings['favorites']) {
        await Promise.all(devices.map(device => {
          return sendPushNotification({
            type: device.type,
            badgeCount: userNotifications.mobile[this.receiverUserId].badgeCount,
            targetARN: device.awsARN
          }, {
            title: 'Favorite',
            body: ``,
            data: {}
          })
        }))
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
    let tracks = new Set<number>()
    let playlists = new Set<number>()
    if (this.repostType === EntityType.Track) {
      tracks.add(this.repostItemId)
    } else {
      playlists.add(this.repostItemId)
    }

    return {
      users: new Set([this.receiverUserId, this.repostUserId]),
      tracks,
      playlists
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.repostUserId]
    let entity
    if (this.repostType === EntityType.Track) {
      const track = resources.tracks[this.repostItemId]
      entity = { type: EntityType.Track, name: track.title, image: track.imageUrl }
    } else {
      const playlist = resources.playlists[this.repostItemId]
      entity = { type: EntityType.Playlist, name: playlist.playlist_name, image: playlist.imageUrl }
    }
    return {
      type: this.notification.type,
      users: [{ name: user.name, image: user.imageUrl }],
      entity
    }
  }

}
