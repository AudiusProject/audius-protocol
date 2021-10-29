import { Dispatch } from 'redux'
import { AnalyticsMessage } from '../types/analytics'

export enum MessageType {
  LOADED = 'loaded',
  PLAY_TRACK = 'play-track',
  PAUSE_TRACK = 'pause-track',
  GET_POSITION = 'get-position',
  SEEK_TRACK = 'seek-track',
  SET_INFO = 'set-info',
  PERSIST_QUEUE = 'persist-queue',
  SET_REPEAT_MODE = 'set-repeat-mode',
  SHUFFLE = 'shuffle',

  // Links
  OPEN_LINK = 'open-link',
  RELOAD = 'reload',
  ACCOUNT_RECOVERY = 'account-recovery',

  // Cast
  AIRPLAY = 'airplay',
  IS_CASTING = 'action/is-casting',

  // Google Cast
  GOOGLE_CAST = 'show-google-cast-picker',

  // Sign On
  SUBMIT_SIGNIN = 'submit-signin',
  SIGN_IN_FAILURE = 'sign-in-failure',
  SIGN_UP_VALIDATE_AND_CHECK_EMAIL = 'sign-up-validate-and-check-email',
  SIGN_UP_VALIDATE_EMAIL_SUCCESS = 'sign-up-validate-email-success',
  SIGN_UP_VALIDATE_EMAIL_FAILURE = 'sign-up-validate-email-failure',
  SIGN_UP_VALIDATE_HANDLE = 'sign-up-validate-handle',
  SIGN_UP_VALIDATE_HANDLE_SUCCESS = 'sign-up-validate-handle-success',
  SIGN_UP_VALIDATE_HANDLE_FAILURE = 'sign-up-validate-handle-failure',
  GET_USERS_TO_FOLLOW = 'get_users_to_follow',
  SET_USERS_TO_FOLLOW = 'set_users_to_follow',
  SET_ACCOUNT_AVAILABLE = 'set_account_available',
  FETCH_ALL_FOLLOW_ARTISTS = 'fetch_all_follow_artists',
  FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED = 'fetch_all_follow_artists_succeeded',
  FETCH_ALL_FOLLOW_ARTISTS_FAILED = 'fetch_all_follow_artists_failed',
  SET_FOLLOW_ARTISTS = 'set_follow_artists',
  SUBMIT_SIGNUP = 'submit-signup',
  SIGN_UP_SUCCESS = 'sign-up-success',

  // Notifications
  ENABLE_PUSH_NOTIFICATIONS = 'enable-push-notifications',
  DISABLE_PUSH_NOTIFICATIONS = 'disable-push-notifications',
  RESET_NOTIFICATIONS_BADGE_COUNT = 'reset-notifications-badge-count',
  ENABLE_PUSH_NOTIFICATIONS_REMINDER = 'action/enable-push-notifications-reminder',
  PROMPT_PUSH_NOTIFICATION_REMINDER = 'prompt-push-notifications-reminder',

  OPEN_NOTIFICATIONS = 'open-notifications',
  FETCH_NOTIFICATIONS = 'fetch-notifications',
  FETCH_NOTIFICATIONS_SUCCESS = 'fetch-notifications-success',
  FETCH_NOTIFICATIONS_REPLACE = 'fetch-notifications-replace',
  FETCH_NOTIFICATIONS_FAILURE = 'fetch-notifications-failure',
  REFRESH_NOTIFICATIONS = 'refresh-notifications',
  MARK_ALL_NOTIFICATIONS_AS_VIEWED = 'mark-all-notifications-as-viewed',

  // Search
  OPEN_SEARCH = 'open-search',
  UPDATE_SEARCH_QUERY = 'update-search-query',
  SUBMIT_SEARCH_QUERY = 'submit-search-query',

  FETCH_SEARCH_SUCCESS = 'fetch-search-success',
  FETCH_SEARCH_FAILURE = 'fetch-search-failure',

  // Haptics
  HAPTIC_FEEDBACK = 'haptic-feedback',

  // Action dispatchers
  SYNC_QUEUE = 'action/sync-queue',
  SYNC_PLAYER = 'action/sync-player',
  PUSH_ROUTE = 'action/push-route',
  SCROLL_TO_TOP = 'action/scroll-to-top',

  // OAuth
  REQUEST_TWITTER_AUTH = 'request-twitter-auth',
  REQUEST_TWITTER_AUTH_SUCCEEDED = 'request-twitter-auth-succeeded',
  REQUEST_TWITTER_AUTH_FAILED = 'request-twitter-auth-failed',
  REQUEST_INSTAGRAM_AUTH = 'request-instagram-auth',
  REQUEST_INSTAGRAM_AUTH_SUCCEEDED = 'request-instagram-auth-succeeded',
  REQUEST_INSTAGRAM_AUTH_FAILED = 'request-instagram-auth-failed',
  REQUEST_TIKTOK_AUTH = 'request-tiktok-auth',

  // Lifecycle
  ENTER_FOREGROUND = 'action/enter-foreground',
  BACKEND_SETUP = 'backend-setup',
  REQUEST_NETWORK_CONNECTED = 'request-network-connected',
  IS_NETWORK_CONNECTED = 'is-network-connected',
  SIGNED_IN = 'signed-in',
  SIGNED_OUT = 'signed-out',
  FETCH_ACCOUNT_FAILED = 'fetch_account_failed',

  // Navigation
  ON_FIRST_PAGE = 'nav-on-first-page',
  NOT_ON_FIRST_PAGE = 'nav-not-on-first-page',
  GO_BACK = 'nav-go-back',
  CHANGED_PAGE = 'nav-changed-page',

  KEYBOARD_VISIBLE = 'keyboard-visible',
  KEYBOARD_HIDDEN = 'keyboard-hidden',

  GET_VERSION = 'get-version',

  // Android specific
  ENABLE_PULL_TO_REFRESH = 'enable-pull-to-refresh',
  DISABLE_PULL_TO_REFRESH = 'disable-pull-to-refresh',
  PREFERS_COLOR_SCHEME = 'prefers-color-scheme',

  SHARE = 'share',

  // Analytics
  ANALYTICS_IDENTIFY = 'analytics-identify',
  ANALYTICS_TRACK = 'analytics-track',
  ANALYTICS_SCREEN = 'analytics-screen',

  // Logging
  LOGGING = 'logging',

  // Theme
  THEME_CHANGE = 'theme-change',

  SYNC_CLIENT_STORE = 'sync-client-store'
}

export type Message = {
  type: string
  [key: string]: any
}

export type MessageHandler = (args: {
  // The message to handle
  message: Message | AnalyticsMessage
  // Used to dispatch an action to the redux store
  dispatch: Dispatch
  // Used to post a message back to the web client
  postMessage: (message: Message) => void
  // Used to reload the WebView
  reload: () => void
}) => void

export type MessageHandlers = {
  [key in MessageType]: MessageHandler
}

export type MessageHandlersGetter = () => Partial<MessageHandlers>
