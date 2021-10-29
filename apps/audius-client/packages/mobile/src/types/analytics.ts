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
  // Account creation
  // When the user opens the create account page
  CREATE_ACCOUNT_OPEN = 'Create Account: Open',
  // When the user continues past the password page
  CREATE_ACCOUNT_COMPLETE_PASSWORD = 'Create Account: Complete Password',
  // When the user starts integrating with twitter
  CREATE_ACCOUNT_START_TWITTER = 'Create Account: Start Twitter',
  // When the user continues past the "twitter connection page"
  CREATE_ACCOUNT_COMPLETE_TWITTER = 'Create Account: Complete Twitter',
  // When the user starts integrating with instagram
  CREATE_ACCOUNT_START_INSTAGRAM = 'Create Account: Start Instagram',
  // When the user continues past the "instagram connection page"
  CREATE_ACCOUNT_COMPLETE_INSTAGRAM = 'Create Account: Complete Instagram',
  // When the user continues past the "profile info page"
  CREATE_ACCOUNT_COMPLETE_PROFILE = 'Create Account: Complete Profile',
  // When the user continues past the follow page
  CREATE_ACCOUNT_COMPLETE_FOLLOW = 'Create Account: Complete Follow',
  // When the user continues past the loading page (in mobile this signifies sign up is complete)
  CREATE_ACCOUNT_FINISH = 'Create Account: Finish',

  // Sign in
  SIGN_IN_OPEN = 'Sign In: Open',

  // Playback
  PLAYBACK_PLAY = 'Playback: Play',
  PLAYBACK_PAUSE = 'Playback: Pause',
  // A listen is when we record against the backend vs. a play which is a UI action
  LISTEN = 'Listen',

  // Notifications
  NOTIFICATIONS_OPEN_PUSH_NOTIFICATION = 'Notifications: Open Push Notification'
}

// Create Account
type CreateAccountOpen = {
  eventName: EventNames.CREATE_ACCOUNT_OPEN
  source: 'sign in page'
}
type CreateAccountCompletePassword = {
  eventName: EventNames.CREATE_ACCOUNT_COMPLETE_PASSWORD
  emailAddress: string
}
type CreateAccountStartTwitter = {
  eventName: EventNames.CREATE_ACCOUNT_START_TWITTER
  emailAddress: string
}
type CreateAccountCompleteTwitter = {
  eventName: EventNames.CREATE_ACCOUNT_COMPLETE_TWITTER
  isVerified: boolean
  emailAddress: string
  handle: string
}
type CreateAccountStartInstagram = {
  eventName: EventNames.CREATE_ACCOUNT_START_INSTAGRAM
  emailAddress: string
}
type CreateAccountCompleteInstagram = {
  eventName: EventNames.CREATE_ACCOUNT_COMPLETE_INSTAGRAM
  isVerified: boolean
  emailAddress: string
  handle: string
}
type CreateAccountCompleteProfile = {
  eventName: EventNames.CREATE_ACCOUNT_COMPLETE_PROFILE
  emailAddress: string
  handle: string
}
type CreateAccountCompleteFollow = {
  eventName: EventNames.CREATE_ACCOUNT_COMPLETE_FOLLOW
  emailAddress: string
  handle: string
  users: string
  count: number
}
type CreateAccountOpenFinish = {
  eventName: EventNames.CREATE_ACCOUNT_FINISH
  emailAddress: string
  handle: string
}

type SignInOpen = {
  eventName: EventNames.SIGN_IN_OPEN
  source: 'sign up page'
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
  | CreateAccountOpen
  | CreateAccountCompletePassword
  | CreateAccountStartTwitter
  | CreateAccountCompleteTwitter
  | CreateAccountStartInstagram
  | CreateAccountCompleteInstagram
  | CreateAccountCompleteProfile
  | CreateAccountCompleteFollow
  | CreateAccountOpenFinish
  | SignInOpen
  | Listen
  | PlaybackPlay
  | PlaybackPause
  | NotificationsOpenPushNotification
