import { Dispatch } from 'redux'
import { 
  NativeModules,
  Linking,
  Platform,
  BackHandler
} from 'react-native'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import * as audioActions from './store/audio/actions'
import * as oauthActions from './store/oauth/actions'
import * as lifecycleActions  from './store/lifecycle/actions'
import { showCastPicker }  from './store/googleCast/controller'
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

  // Haptics
  HAPTIC_FEEDBACK = 'haptic-feedback',

  // Action dispatchers
  SYNC_QUEUE = 'action/sync-queue',
  SYNC_PLAYER = 'action/sync-player',
  PUSH_ROUTE = 'action/push-route',

  // OAuth
  REQUEST_TWITTER_AUTH = 'request-twiter-auth',

  // Lifecycle
  BACKEND_SETUP = 'backend-setup',
  REQUEST_NETWORK_CONNECTED = 'request-network-connected',
  IS_NETWORK_CONNECTED = 'is-network-connected',

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

  // Analytics
  ANALYTICS_IDENTIFY = 'analytics-identify',
  ANALYTICS_TRACK = 'analytics-track',
  ANALYTICS_SCREEN = 'analytics-screen',
}

export interface Message {
  type: MessageType
  [key: string]: any
}

const isIos = Platform.OS === 'ios'

export const handleMessage = async (
  message: Message | AnalyticsMessage,
  dispatch: Dispatch,
  postMessage: (message: string) => void,
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
      postMessage(JSON.stringify({
        type: message.type,
        id: message.id,
        // @ts-ignore
        ...global.progress
      }))
      break
    case MessageType.PERSIST_QUEUE:
      return dispatch(audioActions.persistQueue(message))
    case MessageType.SET_REPEAT_MODE:
      return dispatch(audioActions.repeat(message))
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
    case MessageType.AIRPLAY:
      const airplay = NativeModules.AirplayViewManager
      airplay.click()
      break

    // Haptics
    case MessageType.HAPTIC_FEEDBACK:
      haptics.light()
      break

    // Notifications
    case MessageType.ENABLE_PUSH_NOTIFICATIONS:
      {
        PushNotifications.requestPermission()
        const info = await PushNotifications.getToken()
        postMessage(JSON.stringify({
          type: message.type,
          id: message.id,
          ...info
        }))
        break
      }
    case MessageType.DISABLE_PUSH_NOTIFICATIONS:
      {
        const info = await PushNotifications.getToken()
        PushNotifications.deregister()
        postMessage(JSON.stringify({
          type: message.type,
          id: message.id,
          ...info
        }))
        break
      }
    case MessageType.RESET_NOTIFICATIONS_BADGE_COUNT:
      {
        PushNotifications.setBadgeCount(0)
        break
      }

    // OAuth
    case MessageType.REQUEST_TWITTER_AUTH:
      return dispatch(oauthActions.openPopup(message))

    // Lifecycle
    case MessageType.BACKEND_SETUP:
      return dispatch(lifecycleActions.backendLoaded())
    case MessageType.REQUEST_NETWORK_CONNECTED:
      const isConnected = checkConnectivity(Connectivity.netInfo)
      postMessage(JSON.stringify({
        type: MessageType.IS_NETWORK_CONNECTED,
        isConnected,
        isAction: true
      }))
      break

    // Version
    case MessageType.GET_VERSION:
      const version = VersionNumber.appVersion
      postMessage(JSON.stringify({
        type: message.type,
        id: message.id,
        version
      }))
      break

    // Android specific
    case MessageType.ENABLE_PULL_TO_REFRESH:
      if (isIos) return
      return dispatch(webActions.enablePullToRefresh(message))
    case MessageType.DISABLE_PULL_TO_REFRESH:
      if (isIos) return
      return dispatch(webActions.disablePullToRefresh(message))

    case MessageType.PREFERS_COLOR_SCHEME:
      let prefers
      if (!sentInitialTheme) {
        prefers = getInitialDarkModePreference()
        sentInitialTheme = true
      } else {
        prefers = await getPrefersDarkModeChange()
      }
      postMessage(JSON.stringify({
        type: message.type,
        id: message.id,
        prefersDarkMode: prefers
      }))
      break

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
  }
}
