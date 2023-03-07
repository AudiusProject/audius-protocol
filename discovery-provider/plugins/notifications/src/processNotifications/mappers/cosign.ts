import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import { CosignRemixNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

type CosignRemixNotificationRow = Omit<NotificationRow, 'data'> & { data: CosignRemixNotification }
export class CosignRemix extends BaseNotification<CosignRemixNotificationRow> {

  parentTrackUserId: number
  remixUserId: number
  parentTrackId: number
  trackId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: CosignRemixNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.remixUserId = userIds[0]
    this.parentTrackUserId = parseInt(this.notification.specifier)
    this.parentTrackId = this.notification.data.parent_track_id
    this.trackId = this.notification.data.track_id
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

    const trackRes: Array<{ track_id: number, title: string }> = await this.dnDB.select('track_id', 'title')
      .from<TrackRow>('tracks')
      .where('is_current', true)
      .whereIn('track_id', [this.trackId, this.parentTrackId])
    const tracks = trackRes.reduce((acc, track) => {
      acc[track.track_id] = { title: track.title }
      return acc
    }, {} as Record<number, { title: string }>)

    if (users?.[this.parentTrackUserId]?.isDeactivated) {
      return
    }

    const parentTrackUserName = users[this.parentTrackUserId]?.name
    const remixTrackTitle = tracks[this.trackId]?.title

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
            badgeCount: userNotifications.mobile[this.parentTrackUserId].badgeCount + 1,
            targetARN: device.awsARN
          }, {
            title: 'New Track Co-Sign! 🔥',
            body: `${parentTrackUserName} Co-Signed your Remix of ${remixTrackTitle}`,
            data: {}
          })
        }))
        await this.incrementBadgeCount(this.parentTrackId)
      }
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
      parentTracks: [resources.tracks[this.parentTrackId]],
      parentTrackUser: resources.users[this.parentTrackUserId],
      remixTrack: resources.tracks[this.trackId],
      remixUser: resources.users[this.remixUserId],
    }
  }

}
