import { JsonMap } from '@segment/analytics-react-native'
import { Message } from '../message/types'

export type Identify = {
  handle: string
  traits?: JsonMap
}

export type Track = {
  eventName: string
  properties?: JsonMap
}

export type Screen = {
  route: string
  properties?: JsonMap
}

export type AnalyticsMessage = Message & (Identify | Track | Screen)

export enum EventNames {
  LISTEN = 'Listen',
  PLAYBACK_PLAY = 'Playback: Play',
  PLAYBACK_PAUSE = 'Playback: Pause',
  NOTIFICATIONS_OPEN_PUSH_NOTIFICATION = 'Notifications: Open Push Notification'
}

export type Listen = {
  eventName: EventNames.LISTEN
  trackId: string
}

export enum PlaybackSource {
  PASSIVE = 'passive'
}

type PlaybackPlay = {
  eventName: EventNames.PLAYBACK_PLAY
  id?: string
  source: PlaybackSource
}
type PlaybackPause = {
  eventName: EventNames.PLAYBACK_PAUSE
  id?: string
  source: PlaybackSource
}

type NotificationsOpenPushNotification = {
  eventName: EventNames.NOTIFICATIONS_OPEN_PUSH_NOTIFICATION
  title?: string
  body?: string
}

export type AllEvents =
  | Listen
  | PlaybackPlay
  | PlaybackPause
  | NotificationsOpenPushNotification
