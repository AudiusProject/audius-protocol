import { Dispatch } from 'redux'
import { NativeModules, Linking, Platform } from 'react-native'
import * as audioActions from './store/audio/actions'
import * as oauthActions from './store/oauth/actions'
import * as lifecycleActions from './store/lifecycle/actions'
import * as notificationsActions from './store/notifications/actions'
import * as searchActions from './store/search/actions'
import * as themeActions from './store/theme/actions'
import { showCastPicker } from './store/googleCast/controller'
import * as webActions from './store/web/actions'
import { AppState } from './store'
import * as haptics from './haptics'
import PushNotifications from './notifications'
import VersionNumber from 'react-native-version-number'
import share from './utils/share'
import { getInitialDarkModePreference, getPrefersDarkModeChange } from './theme'
import { track, screen, identify } from './utils/analytics'
import { Identify, Track, Screen, AnalyticsMessage } from './types/analytics'
import { checkConnectivity, Connectivity } from './utils/connectivity'
import { Provider } from './store/oauth/reducer'
import { handleWebAppLog } from './utils/logging'
import { remindUserToTurnOnNotifications } from './components/notification-reminder/NotificationReminder'
import { handleThemeChange } from './utils/theme'
import { Status } from './types/status'

let sentInitialTheme = false

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

  // OAuth
  REQUEST_TWITTER_AUTH = 'request-twitter-auth',
  REQUEST_INSTAGRAM_AUTH = 'request-instagram-auth',

  // Lifecycle
  ENTER_FOREGROUND = 'action/enter-foreground',
  BACKEND_SETUP = 'backend-setup',
  REQUEST_NETWORK_CONNECTED = 'request-network-connected',
  IS_NETWORK_CONNECTED = 'is-network-connected',
  SIGNED_IN = 'signed-in',

  KEYBOARD_VISIBLE = 'keyboard-visible',
  KEYBOARD_HIDDEN = 'keyboard-hidden',

  GET_VERSION = 'get-version',

  // Android specific
  ENABLE_PULL_TO_REFRESH = 'enable-pull-to-refresh',
  DISABLE_PULL_TO_REFRESH = 'disable-pull-to-refresh',
  PREFERS_COLOR_SCHEME = 'prefers-color-scheme',

  SHARE = 'share',

  // Navigation
  ON_FIRST_PAGE = 'nav-on-first-page',
  NOT_ON_FIRST_PAGE = 'nav-not-on-first-page',
  GO_BACK = 'nav-go-back',
  CHANGED_PAGE = 'nav-changed-page',

  // Analytics
  ANALYTICS_IDENTIFY = 'analytics-identify',
  ANALYTICS_TRACK = 'analytics-track',
  ANALYTICS_SCREEN = 'analytics-screen',

  // Logging
  LOGGING = 'logging',

  // Theme
  THEME_CHANGE = 'theme-change'
}

export interface Message {
  type: MessageType
  [key: string]: any
}

const isIos = Platform.OS === 'ios'

export const handleMessage = async (
  message: Message | AnalyticsMessage,
  dispatch: Dispatch,
  postMessage: (message: Message) => void,
  reload: () => void,
  state: AppState
) => {
  switch (message.type) {
    // Audio
    case MessageType.PLAY_TRACK:
      return dispatch(audioActions.play())
    case MessageType.PAUSE_TRACK:
      return dispatch(audioActions.pause())
    case MessageType.SEEK_TRACK:
      return dispatch(audioActions.seek(message))
    case MessageType.GET_POSITION:
      postMessage({
        type: message.type,
        id: message.id,
        // @ts-ignore
        ...global.progress
      })
      break
    case MessageType.PERSIST_QUEUE:
      return dispatch(audioActions.persistQueue(message))
    case MessageType.SET_REPEAT_MODE:
      return dispatch(audioActions.repeat(message))
    case MessageType.SHUFFLE:
      return dispatch(audioActions.shuffle(message))
    case MessageType.OPEN_LINK:
      Linking.openURL(message.url)
      break
    case MessageType.RELOAD:
      dispatch(lifecycleActions.backendTearDown())
      reload()
      break

    // Cast
    case MessageType.GOOGLE_CAST:
      showCastPicker()
      break
    case MessageType.AIRPLAY: {
      const airplay = NativeModules.AirplayViewManager
      airplay.click()
      break
    }

    // Haptics
    case MessageType.HAPTIC_FEEDBACK:
      haptics.light()
      break

    // Notifications
    case MessageType.ENABLE_PUSH_NOTIFICATIONS: {
      PushNotifications.requestPermission()
      const info = await PushNotifications.getToken()
      postMessage({
        type: message.type,
        id: message.id,
        ...info
      })
      break
    }
    case MessageType.DISABLE_PUSH_NOTIFICATIONS: {
      const info = await PushNotifications.getToken()
      PushNotifications.deregister()
      postMessage({
        type: message.type,
        id: message.id,
        ...info
      })
      break
    }
    case MessageType.RESET_NOTIFICATIONS_BADGE_COUNT: {
      PushNotifications.setBadgeCount(0)
      break
    }
    case MessageType.PROMPT_PUSH_NOTIFICATION_REMINDER: {
      remindUserToTurnOnNotifications(postMessage)
      break
    }
    case MessageType.OPEN_NOTIFICATIONS:
      dispatch(notificationsActions.open())
      postMessage({
        type: MessageType.MARK_ALL_NOTIFICATIONS_AS_VIEWED,
        isAction: true
      })
      return
    case MessageType.FETCH_NOTIFICATIONS_SUCCESS:
      dispatch(
        notificationsActions.append(Status.SUCCESS, message.notifications)
      )
      return
    case MessageType.FETCH_NOTIFICATIONS_REPLACE:
      dispatch(
        notificationsActions.replace(Status.SUCCESS, message.notifications)
      )
      return
    case MessageType.FETCH_NOTIFICATIONS_FAILURE:
      return dispatch(notificationsActions.append(Status.FAILURE, []))

    // Search
    case MessageType.OPEN_SEARCH:
      dispatch(searchActions.open(message.reset))
      return

    case MessageType.FETCH_SEARCH_SUCCESS:
      dispatch(
        searchActions.setResults({
          query: message.query,
          results: message.results
        })
      )
      return

    case MessageType.FETCH_SEARCH_FAILURE:
      dispatch(searchActions.fetchSearchFailed({ query: message.query }))
      return

    // OAuth
    case MessageType.REQUEST_TWITTER_AUTH:
      return dispatch(oauthActions.openPopup(message, Provider.TWITTER))
    case MessageType.REQUEST_INSTAGRAM_AUTH:
      return dispatch(oauthActions.openPopup(message, Provider.INSTAGRAM))

    // Lifecycle
    case MessageType.BACKEND_SETUP:
      return dispatch(lifecycleActions.backendLoaded())
    case MessageType.SIGNED_IN:
      return dispatch(lifecycleActions.signedIn(message.account))
    case MessageType.REQUEST_NETWORK_CONNECTED: {
      const isConnected = checkConnectivity(Connectivity.netInfo)
      postMessage({
        type: MessageType.IS_NETWORK_CONNECTED,
        isConnected,
        isAction: true
      })
      break
    }

    // Version
    case MessageType.GET_VERSION: {
      const version = VersionNumber.appVersion
      postMessage({
        type: message.type,
        id: message.id,
        version
      })
      break
    }

    // Android specific
    case MessageType.ENABLE_PULL_TO_REFRESH:
      if (isIos) return
      return dispatch(webActions.enablePullToRefresh(message))
    case MessageType.DISABLE_PULL_TO_REFRESH:
      if (isIos) return
      return dispatch(webActions.disablePullToRefresh(message))

    case MessageType.PREFERS_COLOR_SCHEME: {
      let prefers
      if (!sentInitialTheme) {
        prefers = getInitialDarkModePreference()
        sentInitialTheme = true
      } else {
        prefers = await getPrefersDarkModeChange()
      }
      postMessage({
        type: message.type,
        id: message.id,
        prefersDarkMode: prefers
      })
      break
    }

    case MessageType.SHARE:
      if (isIos) return
      await share({
        message: message.message,
        url: message.url
      })
      break

    case MessageType.ANALYTICS_IDENTIFY: {
      await identify(message as Identify)
      break
    }
    case MessageType.ANALYTICS_TRACK: {
      await track(message as Track)
      break
    }
    case MessageType.ANALYTICS_SCREEN: {
      await screen(message as Screen)
      break
    }
    case MessageType.ON_FIRST_PAGE: {
      return dispatch(lifecycleActions.onFirstPage())
    }
    case MessageType.NOT_ON_FIRST_PAGE: {
      return dispatch(lifecycleActions.notOnFirstPage())
    }
    case MessageType.CHANGED_PAGE: {
      return dispatch(lifecycleActions.changedPage(message.location))
    }
    case MessageType.LOGGING: {
      handleWebAppLog(message.level, message.message)
      break
    }

    case MessageType.THEME_CHANGE: {
      dispatch(themeActions.set(message.theme))
      handleThemeChange(message.theme)
      break
    }
  }
}
