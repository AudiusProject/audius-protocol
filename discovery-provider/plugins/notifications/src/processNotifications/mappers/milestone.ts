import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { FollowerMilestoneNotification, PlaylistMilestoneNotification, TrackMilestoneNotification } from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { ChallengeId } from '../../email/notifications/types'

// export type FollowerMilestoneNotification = {
//   type: string
//   user_id: number
//   threshold: number
// }

// export type TrackMilestoneNotification = {
//   type: string
//   track_id: number
//   threshold: number
// }

// export type PlaylistMilestoneNotification = {
//   type: string
//   playlist_id: number
//   threshold: number
// }

type MilestoneRow = Omit<NotificationRow, 'data'> & { data: FollowerMilestoneNotification | TrackMilestoneNotification | PlaylistMilestoneNotification }
export class ChallengeReward extends BaseNotification<MilestoneRow> {


  receiverUserId: number
  threshold: number
  type: string
  challengeId: ChallengeId

  constructor(dnDB: Knex, identityDB: Knex, notification: MilestoneRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.type = this.notification.data.type
    this.threshold = this.notification.data.threshold
  }

  async pushNotification() {

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)


    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(this.receiverUserId)

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length > 0) {
      const devices: Device[] = userNotifications.mobile?.[this.receiverUserId].devices
      await Promise.all(devices.map(device => {
        return sendPushNotification({
          type: device.type,
          badgeCount: userNotifications.mobile[this.receiverUserId].badgeCount,
          targetARN: device.awsARN
        }, {
          title: '',
          body: ``,
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
    }
  }

  formatEmailProps(resources: Resources) {
    const receiverUserId = resources.users[this.receiverUserId]
    return {
      type: this.notification.type,
      threshold: this.threshold
    }
  }

}
