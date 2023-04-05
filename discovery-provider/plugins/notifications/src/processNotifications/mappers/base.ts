import { Knex } from 'knex'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

export type DeviceType = 'ios' | 'android'

export type EmailFrequency = 'off' | 'live' | 'daily' | 'weekly'

export type WebPush = {
  endpoint: string
  p256dhKey: string
  authKey: string
}
export type SafariPush = {
  type: string
  awsARN: string
  deviceToken: string
}
export type Browser = WebPush | SafariPush

export type Device = {
  type: DeviceType
  awsARN: string
  deviceToken: string
}

export type NotificationSettings = {
  favorites: boolean
  milestonesAndAchievements: boolean
  reposts: boolean
  announcements: boolean
  followers: boolean
  remixes: boolean
  messages: boolean
}

type UserBrowserSettings = {
  [userId: number]: {
    settings: NotificationSettings
    browser: Browser[]
  }
}
type UserMobileSettings = {
  [userId: number]: {
    settings: NotificationSettings
    badgeCount: number
    devices: Device[]
  }
}

type UserEmailSettings = {
  [userId: number]: EmailFrequency
}

export abstract class BaseNotification<Type> {
  notification: Type
  dnDB: Knex
  identityDB: Knex

  constructor(dnDB: Knex, identityDB: Knex, notification: Type) {
    this.notification = notification
    this.dnDB = dnDB
    this.identityDB = identityDB
  }

  async incrementBadgeCount(userId: number) {
    await this.identityDB('PushNotificationBadgeCounts')
      .insert({
        userId,
        iosBadgeCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflict('userId')
      .merge({
        iosBadgeCount: this.identityDB.raw('?? + ?', [
          'PushNotificationBadgeCounts.iosBadgeCount',
          1
        ]),
        updatedAt: new Date()
      })
  }

  /**
   * Fetches the user's notification settings
   *
   * @param userId User id to fetch notification settings for
   * @returns
   */
  async getUserNotificationSettings(userId: number) {
    const [
      userMobileNotificationSettings,
      userBrowserNotificationSettings,
      userEmailSettings,
      userIsAbusive
    ] = await Promise.all([
      this.getUserMobileNotificationSettings([userId]),
      this.getUserBrowserSettings([userId]),
      this.getUserEmailSettings([userId]),
      this.getUserIsAbusive([userId])
    ])
    return {
      mobile: userMobileNotificationSettings,
      browser: userBrowserNotificationSettings,
      email: userEmailSettings,
      userIsAbusive: userIsAbusive
    }
  }

  async getDevices() {}

  async shouldSendPushNotification(userId: number, notificationSettings) {
    const isAbusive = false
    return (
      (notificationSettings.mobile?.[userId]?.devices ?? []).length > 0 &&
      !isAbusive
    )
  }

  async getUserIsAbusive(userIds: number[]) {
    const usersIsAbusive: Array<{
      userId: number
      isAbusive: boolean
    }> = await this.identityDB
      .select(
        'Users.blockchainUserId',
        'Users.isBlockedFromNotifications',
        'Users.isBlockedFromRelay'
      )
      .from('Users')
      .whereIn('Users.blockchainUserId', userIds)
    return usersIsAbusive
  }

  /**
   * Fetches the user's mobile push notification settings
   *
   * @param userIds User ids to fetch notification settings
   * @returns
   */
  async getUserMobileNotificationSettings(
    userIds: number[]
  ): Promise<UserMobileSettings> {
    const userNotifSettingsMobile: Array<{
      userId: number
      favorites: boolean
      milestonesAndAchievements: boolean
      reposts: boolean
      announcements: boolean
      followers: boolean
      remixes: boolean
      messages: boolean
      deviceType: string
      awsARN: string
      deviceToken: string
      iosBadgeCount: number | null
    }> = await this.identityDB
      .select(
        'UserNotificationMobileSettings.userId',
        'UserNotificationMobileSettings.favorites',
        'UserNotificationMobileSettings.milestonesAndAchievements',
        'UserNotificationMobileSettings.reposts',
        'UserNotificationMobileSettings.announcements',
        'UserNotificationMobileSettings.followers',
        'UserNotificationMobileSettings.remixes',
        'UserNotificationMobileSettings.messages',
        'NotificationDeviceTokens.deviceType',
        'NotificationDeviceTokens.awsARN',
        'NotificationDeviceTokens.deviceToken',
        'PushNotificationBadgeCounts.iosBadgeCount'
      )
      .from('UserNotificationMobileSettings')
      .innerJoin(
        'NotificationDeviceTokens',
        'NotificationDeviceTokens.userId',
        '=',
        'UserNotificationMobileSettings.userId'
      )
      .leftJoin(
        'PushNotificationBadgeCounts',
        'PushNotificationBadgeCounts.userId',
        '=',
        'UserNotificationMobileSettings.userId'
      )
      .whereIn('UserNotificationMobileSettings.userId', userIds)
      .andWhere('NotificationDeviceTokens.enabled', '=', true)
      .whereIn('NotificationDeviceTokens.deviceType', ['ios', 'android'])

    const userMobileSettings = userNotifSettingsMobile.reduce(
      (acc, setting) => {
        acc[setting.userId] = {
          settings: {
            favorites: setting.favorites,
            milestonesAndAchievements: setting.milestonesAndAchievements,
            reposts: setting.reposts,
            announcements: setting.announcements,
            followers: setting.followers,
            remixes: setting.remixes,
            messages: setting.messages
          },
          devices: [
            ...(acc?.[setting.userId]?.devices ?? []),
            {
              type: setting.deviceType as DeviceType,
              awsARN: setting.awsARN,
              deviceToken: setting.deviceToken
            }
          ],
          badgeCount: setting.iosBadgeCount || 0
        }
        return acc
      },
      {} as UserMobileSettings
    )
    return userMobileSettings
  }

  /**
   * Fetches the user's mobile push notification settings
   *
   * @param userIds User ids to fetch notification settings
   * @returns
   */
  async getUserEmailSettings(
    userIds: number[],
    frequency?: EmailFrequency
  ): Promise<UserEmailSettings> {
    const userNotifSettings: Array<{
      userId: number
      emailFrequency: EmailFrequency
    }> = await this.identityDB
      .select(
        'UserNotificationSettings.userId',
        'UserNotificationSettings.emailFrequency'
      )
      .from('UserNotificationSettings')
      .whereIn('UserNotificationSettings.userId', userIds)
      .modify((queryBuilder) => {
        if (frequency) {
          queryBuilder.where('emailFrequency', frequency)
        }
      })
    const userEmailSettings: UserEmailSettings = userNotifSettings.reduce(
      (acc, user) => {
        acc[user.userId] = user.emailFrequency
        return acc
      },
      {} as UserEmailSettings
    )
    return userEmailSettings
  }

  /**
   * Fetches the user's browser push notification settings
   *
   * @param userIds User ids to fetch notification settings
   * @returns
   */
  async getUserBrowserSettings(
    userIds: number[]
  ): Promise<UserBrowserSettings> {
    const userNotifSettingsBrowser: Array<{
      userId: number
      favorites: boolean
      milestonesAndAchievements: boolean
      reposts: boolean
      announcements: boolean
      followers: boolean
      remixes: boolean
      messages: boolean
      deviceType?: string
      awsARN?: string
      deviceToken?: string
      endpoint?: string
      p256dhKey?: string
      authKey?: string
    }> = await this.identityDB
      .select(
        'UserNotificationBrowserSettings.userId',
        'UserNotificationBrowserSettings.favorites',
        'UserNotificationBrowserSettings.milestonesAndAchievements',
        'UserNotificationBrowserSettings.reposts',
        'UserNotificationBrowserSettings.announcements',
        'UserNotificationBrowserSettings.followers',
        'UserNotificationBrowserSettings.remixes',
        'UserNotificationBrowserSettings.messages',
        'NotificationDeviceTokens.deviceType', // Note safari switch to web push protocol last yr for safari 16+
        'NotificationDeviceTokens.awsARN', // so these fields are no longer necessary if we don't want to support
        'NotificationDeviceTokens.deviceToken', // legacy safari push notifs
        'NotificationBrowserSubscriptions.endpoint',
        'NotificationBrowserSubscriptions.p256dhKey',
        'NotificationBrowserSubscriptions.authKey'
      )
      .from('UserNotificationBrowserSettings')
      .leftJoin(
        'NotificationDeviceTokens',
        'NotificationDeviceTokens.userId',
        'UserNotificationBrowserSettings.userId'
      )
      .leftJoin(
        'NotificationBrowserSubscriptions',
        'NotificationBrowserSubscriptions.userId',
        'UserNotificationBrowserSettings.userId'
      )
      .whereIn('UserNotificationBrowserSettings.userId', userIds)
      .whereIn('NotificationDeviceTokens.deviceType', ['safari'])
      .andWhere('NotificationDeviceTokens.enabled', true)
      .andWhere('NotificationBrowserSubscriptions.enabled', true)

    const userBrowserSettings = userNotifSettingsBrowser.reduce(
      (acc, setting) => {
        const safariSettings =
          setting.deviceType && setting.awsARN && setting.deviceToken
            ? {
              type: setting.deviceType,
              awsARN: setting.awsARN,
              deviceToken: setting.deviceToken
            }
            : undefined

        const webPushSettings =
          setting.endpoint && setting.p256dhKey && setting.authKey
            ? {
              endpoint: setting.endpoint,
              p256dhKey: setting.p256dhKey,
              authKey: setting.authKey
            }
            : undefined
        if (!safariSettings && !webPushSettings) {
          return acc
        }

        acc[setting.userId] = {
          settings: {
            favorites: setting.favorites,
            milestonesAndAchievements: setting.milestonesAndAchievements,
            reposts: setting.reposts,
            announcements: setting.announcements,
            followers: setting.followers,
            remixes: setting.remixes,
            messages: setting.messages
          },
          browser: acc?.[setting.userId]?.browser ?? []
        }
        if (safariSettings) {
          acc[setting.userId].browser.push(safariSettings)
        }
        if (webPushSettings) {
          acc[setting.userId].browser.push(webPushSettings)
        }
        return acc
      },
      {} as UserBrowserSettings
    )
    return userBrowserSettings
  }

  async pushNotification() {
    return
  }


  getNotificationTimestamp() {
    const timestamp = Math.floor(Date.parse((this.notification as any).timestamp as string) / 1000)
    return timestamp
  }

  getResourcesForEmail(): ResourceIds {
    return {}
  }

  formatEmailProps(
    resources: Resources,
    additionalNotifications?: BaseNotification<Type>[]
  ) {
    return {}
  }
}
