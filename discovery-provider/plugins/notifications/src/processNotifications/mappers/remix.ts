import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { RemixNotification, RepostNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'

type RemixNotificationRow = Omit<NotificationRow, 'data'> & { data: RemixNotification }
export class Remix extends BaseNotification<RemixNotificationRow> {

  parentTrackUserId: number
  remixUserId: number
  parentTrackId: number
  trackId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: RemixNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.parentTrackUserId = userIds[0]
    this.parentTrackId = this.notification.data.parent_track_id
    this.trackId = this.notification.data.track_id
    this.remixUserId = parseInt(this.notification.specifier)
  }

  async pushNotification() {

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.remixUserId, this.parentTrackUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)


    if (users?.[this.parentTrackUserId]?.isDeactivated) {
      return
    }

    // TODO: Fetch the remix track and parent track

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(this.parentTrackUserId)

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.parentTrackUserId]?.devices ?? []).length > 0) {
      const userMobileSettings: NotificationSettings = userNotifications.mobile?.[this.parentTrackUserId].settings
      const devices: Device[] = userNotifications.mobile?.[this.parentTrackUserId].devices
      // If the user's settings for the follow notification is set to true, proceed
      if (userMobileSettings['favorites']) {
        await Promise.all(devices.map(device => {
          return sendPushNotification({
            type: device.type,
            badgeCount: userNotifications.mobile[this.parentTrackUserId].badgeCount,
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
    return {
      users: new Set([this.parentTrackUserId, this.remixUserId]),
      tracks: new Set([this.trackId, this.parentTrackId])
    }
  }

  formatEmailProps(resources: Resources) {
    return {
      type: this.notification.type,
      parentTrack: resources.tracks[this.parentTrackId],
      parentTrackUser: resources.users[this.parentTrackUserId],
      remixTrack: resources.tracks[this.trackId],
      remixUser: resources.users[this.remixUserId],
    }
  }

}
