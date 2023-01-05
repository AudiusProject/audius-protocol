import type { AllTrackingEvents as CommonTrackingEvents } from '@audius/common'
import { Name as CommonEventNames } from '@audius/common'

enum MobileEventNames {
  NOTIFICATIONS_OPEN_PUSH_NOTIFICATION = 'Notifications: Open Push Notification',
  APP_ERROR = 'App Unexpected Error',
  SHARE_TO_IG_STORY = 'Share to Instagram story - start',
  SHARE_TO_IG_STORY_CANCELLED = 'Share to Instagram story - cancelled',
  SHARE_TO_IG_STORY_ERROR = 'Share to Instagram story - error',
  SHARE_TO_IG_STORY_SUCCESS = 'Share to Instagram story - success',
  SHARE_TO_SNAPCHAT = 'Share to Snapchat - start',
  SHARE_TO_SNAPCHAT_CANCELLED = 'Share to Snapchat - cancelled',
  SHARE_TO_SNAPCHAT_ERROR = 'Share to Snapchat - error',
  SHARE_TO_SNAPCHAT_STORY_SUCCESS = 'Share to Snapchat - success'
}

export const EventNames = { ...CommonEventNames, ...MobileEventNames }

type NotificationsOpenPushNotification = {
  eventName: MobileEventNames.NOTIFICATIONS_OPEN_PUSH_NOTIFICATION
  title?: string
  body?: string
}

type ShareToIGStory = {
  eventName:
    | MobileEventNames.SHARE_TO_IG_STORY
    | MobileEventNames.SHARE_TO_IG_STORY_CANCELLED
    | MobileEventNames.SHARE_TO_IG_STORY_SUCCESS
  title?: string
  artist?: string
}

type ShareToSnapchat = {
  eventName:
    | MobileEventNames.SHARE_TO_SNAPCHAT
    | MobileEventNames.SHARE_TO_SNAPCHAT_CANCELLED
    | MobileEventNames.SHARE_TO_SNAPCHAT_STORY_SUCCESS
  title?: string
  artist?: string
}

type ShareToIGStoryError = {
  eventName: MobileEventNames.SHARE_TO_IG_STORY_ERROR
  title?: string
  artist?: string
  error: string
}

type ShareToSnapchatError = {
  eventName: MobileEventNames.SHARE_TO_SNAPCHAT_ERROR
  title?: string
  artist?: string
  error: string
}

type AppError = {
  eventName: MobileEventNames.APP_ERROR
  message?: string
}

type MobileTrackingEvents =
  | NotificationsOpenPushNotification
  | AppError
  | ShareToIGStory
  | ShareToIGStoryError
  | ShareToSnapchat
  | ShareToSnapchatError

export type AllEvents = CommonTrackingEvents | MobileTrackingEvents

export type JsonMap = Record<string, unknown>

export type Track = {
  eventName: string
  properties?: JsonMap
}

export type Screen = {
  route: string
  properties?: JsonMap
}

export {
  PlaybackSource,
  ShareSource,
  RepostSource,
  FavoriteSource,
  FollowSource,
  CreatePlaylistSource
} from '@audius/common'
