import { Permission } from '~/utils/browserNotifications'

export enum BrowserNotificationSetting {
  BrowserPush = 'browserPush',
  MilestonesAndAchievements = 'milestonesAndAchievements',
  Followers = 'followers',
  Reposts = 'reposts',
  Favorites = 'favorites',
  Permission = 'permission',
  Remixes = 'remixes',
  Messages = 'messages'
}

export enum PushNotificationSetting {
  MobilePush = 'mobilePush',
  MilestonesAndAchievements = 'milestonesAndAchievements',
  Followers = 'followers',
  Reposts = 'reposts',
  Favorites = 'favorites',
  Remixes = 'remixes',
  Messages = 'messages'
}

export enum EmailFrequency {
  Live = 'live',
  Daily = 'daily',
  Weekly = 'weekly',
  Off = 'off'
}

export const emailFrequency = 'emailFrequency'

export type Notifications = {
  [BrowserNotificationSetting.Permission]: Permission | null
  [BrowserNotificationSetting.BrowserPush]: boolean
  [BrowserNotificationSetting.MilestonesAndAchievements]: boolean
  [BrowserNotificationSetting.Followers]: boolean
  [BrowserNotificationSetting.Reposts]: boolean
  [BrowserNotificationSetting.Favorites]: boolean
  [BrowserNotificationSetting.Remixes]: boolean
  [BrowserNotificationSetting.Messages]: boolean
}

export type PushNotifications = {
  [PushNotificationSetting.MobilePush]: boolean
  [PushNotificationSetting.MilestonesAndAchievements]: boolean
  [PushNotificationSetting.Followers]: boolean
  [PushNotificationSetting.Reposts]: boolean
  [PushNotificationSetting.Favorites]: boolean
  [PushNotificationSetting.Remixes]: boolean
  [PushNotificationSetting.Messages]: boolean
}

export enum Cast {
  AIRPLAY = 'AIRPLAY',
  CHROMECAST = 'CHROMECAST'
}

export type SettingsPageState = {
  browserNotifications: Notifications
  pushNotifications: PushNotifications
  emailFrequency: EmailFrequency
}
