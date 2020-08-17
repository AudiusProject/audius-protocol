import { Permission } from 'utils/browserNotifications'

export enum BrowserNotificationSetting {
  BrowserPush = 'browserPush',
  MilestonesAndAchievements = 'milestonesAndAchievements',
  Followers = 'followers',
  Reposts = 'reposts',
  Favorites = 'favorites',
  Permission = 'permission',
  Remixes = 'remixes'
}

export enum PushNotificationSetting {
  MobilePush = 'mobilePush',
  MilestonesAndAchievements = 'milestonesAndAchievements',
  Followers = 'followers',
  Reposts = 'reposts',
  Favorites = 'favorites',
  Remixes = 'remixes'
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
}

export type PushNotifications = {
  [PushNotificationSetting.MobilePush]: boolean
  [PushNotificationSetting.MilestonesAndAchievements]: boolean
  [PushNotificationSetting.Followers]: boolean
  [PushNotificationSetting.Reposts]: boolean
  [PushNotificationSetting.Favorites]: boolean
  [PushNotificationSetting.Remixes]: boolean
}

export enum Cast {
  AIRPLAY = 'AIRPLAY',
  CHROMECAST = 'CHROMECAST'
}

export default interface SettingsPageState {
  browserNotifications: Notifications
  pushNotifications: PushNotifications
  emailFrequency: EmailFrequency
  castMethod: Cast
}
