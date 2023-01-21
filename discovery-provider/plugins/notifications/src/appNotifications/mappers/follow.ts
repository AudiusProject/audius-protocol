import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { FollowNotification } from '../../types/appNotifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'

export class Follow extends BaseNotification {

  receiverUserId: number
  followerUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: NotificationRow & { data: FollowNotification }) {
    super(dnDB, identityDB, notification)
    const userIds = this.notification.user_ids!
    const followeeUserId = userIds[0]
    this.followerUserId = this.notification.data.follower_user_id
    this.receiverUserId = followeeUserId
  }

  async pushNotification() {
    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.followerUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {})

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    // Get the user's notification setting from identity service
    const userNotifications = await this.getShouldSendNotification()

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length > 0) {
      const userMobileSettings = userNotifications.mobile?.[this.receiverUserId].settings
      const devices = userNotifications.mobile?.[this.receiverUserId].devices
      // If the user's settings for the follow notification is set to true, proceed
      if (userMobileSettings['followers']) {
        await Promise.all(devices.map(device => {
          return sendPushNotification({
            type: device.type,
            badgeCount: userNotifications.mobile[this.receiverUserId].badgeCount,
            targetARN: device.awsARN
          }, {
            title: 'Follow',
            body: `${users[this.followerUserId].name} followed you`,
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


  getShouldSendNotification = async () => {

    const [
      userMobileNotificationSettings,
      userBrowserNotificationSettings,
      userEmailSettings
    ] = await Promise.all([
      this.getUserMobileNotificationSettings([this.receiverUserId]),
      this.getUserBrowserSettings([this.receiverUserId]),
      this.getUserEmailSettings([this.receiverUserId]),
    ])
    return {
      mobile: userMobileNotificationSettings,
      browser: userBrowserNotificationSettings,
      email: userEmailSettings
    }
  }

}
