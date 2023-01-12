import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { sendAndroidMessage, sendIOSMessage } from '../../sns'

export abstract class BaseNotification {
  notification: NotificationRow
  dnDB: Knex
  identityDB: Knex

  constructor(dnDB: Knex, identityDB: Knex, notification: NotificationRow) {
    this.notification = notification
    this.dnDB = dnDB
    this.identityDB = identityDB
  }

  abstract pushNotification(): Promise<void>

  /**
   * Fetches the user's mobile push notification settings
   * 
   * @param userIds User ids to fetch notification settings
   * @returns 
   */
  async getUserNotificationSettings(userIds: number[]) {

    const userNotifSettingsMobile = await this.identityDB
      .select(
        'UserNotificationMobileSettings.userId',
      )
      .from("UserNotificationMobileSettings")
      .innerJoin('NotificationDeviceTokens', 'NotificationDeviceTokens.userId', '=', 'UserNotificationMobileSettings.user_id')
      .whereIn("UserNotificationMobileSettings.userId", userIds)
      .andWhere("NotificationDeviceTokens.enabled", '=', true)
      .whereIn("NotificationDeviceTokens.deviceType", ['ios', 'android'])
    return userNotifSettingsMobile
  }

  /**
   * Fetches the user's browser push notification settings
   * 
   * @param userIds User ids to fetch notification settings
   * @returns 
   */
  async getUserBrowserSettings(userIds: number[]) {
    const userBrowserQuery = this.identityDB
      .select("userId")
      .from("NotificationDeviceTokens")
      .where({ "enabled": true })
      .whereIn("deviceType", ['safari'])

    const userBrowserSubscriptionQuery = this.identityDB
      .select("userId")
      .from("NotificationBrowserSubscriptions")
      .where({ "enabled": true })


    const userNotifSettingsBrowser = await this.identityDB
      .from("UserNotificationBrowserSettings")
      .whereIn("userId", userIds)
      .andWhere("userId", userBrowserQuery)
      .andWhere("userId", userBrowserSubscriptionQuery)
    return userNotifSettingsBrowser
  }
}