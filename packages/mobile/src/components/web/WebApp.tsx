import {
  Platform,
  NativeSyntheticEvent,
  Linking,
  BackHandler,
  StatusBar
} from 'react-native'
import React, {
  useRef,
  useState,
  useEffect,
  RefObject,
  useCallback
} from 'react'
import Config from 'react-native-config'
import AsyncStorage from '@react-native-community/async-storage'
import VersionNumber from 'react-native-version-number'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { WebView } from 'react-native-webview'
import StaticServer from 'react-native-static-server'
import RNFS from 'react-native-fs'

import PullToRefresh from './PullToRefresh'
import { Message, handleMessage, MessageType } from '../../message'
import {
  WebViewMessage,
  WebViewNavigation
} from 'react-native-webview/lib/WebViewTypes'
import { AppState } from '../../store'
import { getTrack, getIndex } from '../../store/audio/selectors'
import {
  getIsOnFirstPage,
  getIsSignedIn
} from '../../store/lifecycle/selectors'
import SplashScreen from '../splash-screen/SplashScreen'
import {
  postMessage,
  postMessage as postMessageUtil
} from '../../utils/postMessage'
import { MessagePostingWebView } from '../../types/MessagePostingWebView'
import useAppState from '../../utils/useAppState'
import useKeyboardListeners from '../../utils/useKeyboardListeners'
import NotificationReminder from '../notification-reminder/NotificationReminder'

const URL_OVERRIDE = Config.URL_OVERRIDE
const STATIC_PORT = Config.STATIC_SERVER_PORT || 3100
export const URL_SCHEME = 'audius://'

// Intercept localhost://, file:///, audius://, twitter embed, or recaptcha
const URL_INTERCEPT_PATTERN = /^(http:\/\/localhost|file:\/\/\/|audius:\/\/|https:\/\/platform.twitter|https:\/\/www.google.com\/recaptcha\/.*)/
const AUDIUS_SITE_PREFIX = /^(https|http):\/\/audius.co\//
const AUDIUS_REDIRECT_SITE_PREFIX = /^(https|http):\/\/redirect.audius.co\/app-redirect\//
const AUDIUS_PORT_INCLUDE_PATTERN = /(:3100|:3101)/

// Android Paths
const DOCUMENT_DIRECTORY_PATH = RNFS.DocumentDirectoryPath
const BUNDLE_PATH = 'Web.bundle/build'
const ANDROID_BUNDLE_PATH = `${DOCUMENT_DIRECTORY_PATH}/${BUNDLE_PATH}`

// If a link is opened from the DApp and is in this list, it is opened in the browser
// rather than as a deep link
const AUDIUS_WEBLINK_WHITELIST = new Set([
  'https://audius.co/legal/terms-of-use',
  'https://audius.co/legal/privacy-policy'
])

const getPath = async () => {
  if (Platform.OS === 'android') {
    return copyAndroidAssets()
  } else {
    return RNFS.MainBundlePath + '/Web.bundle/build'
  }
}

// Recursively get all file paths in the folder
// Make the corresponding directory in the files directory
const getAllFiles = async (
  folderPath: string,
  path: string
): Promise<Array<string>> => {
  const filePaths = []
  const assetDirItems = await RNFS.readDirAssets(path)
  for (const dirItem of assetDirItems) {
    if (dirItem.isFile()) {
      filePaths.push(dirItem.path)
    } else {
      await RNFS.mkdir(`${folderPath}/${dirItem.path}`)
      const dirItemFiles = await getAllFiles(folderPath, dirItem.path)
      filePaths.push(...dirItemFiles)
    }
  }
  return filePaths
}

// The static server does not allow files to be served from the assets directory,
// & Android does not have a MainBundle directory (ios does), so the static files are
// moved from the assets folder into the files directory
const copyAndroidAssets = async () => {
  const hasCopiedAssets = await RNFS.exists(`${ANDROID_BUNDLE_PATH}/index.html`)
  const lastAppCopyVersion = await AsyncStorage.getItem(
    '@last-app-copy-version'
  )
  if (hasCopiedAssets && VersionNumber.appVersion === lastAppCopyVersion) {
    return ANDROID_BUNDLE_PATH
  }
  // If we have previous bundle copied, clear out the scripts and static resources
  // Since they won't be used by the new bundle we'll copy
  if (hasCopiedAssets) {
    await RNFS.unlink(`${ANDROID_BUNDLE_PATH}/index.html`)
    await RNFS.unlink(`${ANDROID_BUNDLE_PATH}/scripts`)
    await RNFS.unlink(`${ANDROID_BUNDLE_PATH}/static`)
  }
  await RNFS.mkdir(ANDROID_BUNDLE_PATH)
  const files = await getAllFiles(DOCUMENT_DIRECTORY_PATH, BUNDLE_PATH)
  await Promise.all(
    files.map(async filePath => {
      await RNFS.copyFileAssets(
        filePath,
        `${DOCUMENT_DIRECTORY_PATH}/${filePath}`
      )
    })
  )
  await AsyncStorage.setItem('@last-app-copy-version', VersionNumber.appVersion)
  return ANDROID_BUNDLE_PATH
}

type OwnProps = {
  webRef: RefObject<MessagePostingWebView>
}

type Props = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const WebApp = ({
  onMessage,
  webRef,
  state,
  trackInfo,
  trackIndex,
  isOnFirstPage,
  isSignedIn,
  state: {
    lifecycle: { dappLoaded }
  }
}: Props) => {
  // Start the local static asset server
  const [url, setUrl] = useState<string>('')
  const [hasLoaded, setHasLoaded] = useState(false)
  const serverContainer = useRef<any | null>(null)
  const path = useRef<string | null>(null)
  const serverRestarting = useRef(false)
  const checkServerInterval = useRef<NodeJS.Timeout | null>(null)

  const [key, setKey] = useState(0)
  const reload = useCallback(() => {
    setKey(key => key + 1)
  }, [setKey])

  const isRunning = useCallback(async () => {
    try {
      const resp = await fetch(url)
      return resp.status === 200
    } catch (e) {
      return false
    }
  }, [url])

  useEffect(() => {
    StatusBar.setHidden(true)
  }, [])

  useEffect(() => {
    const asyncEffect = async () => {
      path.current = await getPath()
      const server = new StaticServer(STATIC_PORT, path.current, {
        localOnly: true,
        keepAlive: true
      })

      serverContainer.current = server

      server.start().then((servingUrl: string) => {
        setUrl(servingUrl)
        console.info('Serving static assets: ', servingUrl)
      })
    }
    asyncEffect()
  }, [setUrl])

  const checkAndRestartServer = useCallback(() => {
    // If we haven't yet set a URL, abort
    if (url === '') return

    // If we're restarting, abort
    if (serverRestarting.current) return

    isRunning().then((running: boolean) => {
      if (!running) {
        if (serverContainer.current) {
          serverContainer.current.stop()
        }

        // If we're restarting, abort
        if (serverRestarting.current) return
        serverRestarting.current = true

        const server = new StaticServer(STATIC_PORT, path.current, {
          localOnly: true,
          keepAlive: true
        })
        serverContainer.current = server
        server.start().then((servingUrl: string) => {
          setUrl(servingUrl) // should not change url
          serverRestarting.current = false
          console.info('Restarted serving static assets: ', servingUrl)
        })
      }
    })
  }, [serverContainer, serverRestarting, isRunning, url])

  const reloadViewOnServerError = useCallback(() => {
    const reloadViewOnServerRunning = async () => {
      const serverIsRunning = await isRunning()
      if (!serverIsRunning) {
        checkAndRestartServer()
        const reloadWebviewInterval = setInterval(async () => {
          const running = await isRunning()
          if (running) {
            reload()
            clearInterval(reloadWebviewInterval)
          }
        }, 5000)
      } else {
        reload()
      }
    }
    reloadViewOnServerRunning()
  }, [checkAndRestartServer, reload, isRunning])

  const resetServerInterval = useCallback(() => {
    if (checkServerInterval.current) {
      clearInterval(checkServerInterval.current)
    }
    checkServerInterval.current = setInterval(() => {
      checkAndRestartServer()
    }, 5000)
  }, [checkServerInterval, checkAndRestartServer])

  useEffect(() => {
    resetServerInterval()
  }, [resetServerInterval])

  const backHandler = useCallback(() => {
    if (webRef.current) {
      if (isOnFirstPage && Platform.OS === 'android') {
        BackHandler.exitApp()
      } else {
        if (Platform.OS === 'android') {
          postMessage(webRef.current, {
            type: MessageType.GO_BACK,
            isAction: true
          })
        } else {
          webRef.current.goBack()
        }
      }
      // Prevent default (exit app)
      return true
    }
    return false
  }, [webRef, isOnFirstPage])

  useEffect(() => {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', backHandler)
    }
    return () => {
      if (Platform.OS === 'android') {
        BackHandler.removeEventListener('hardwareBackPress', backHandler)
      }
    }
  }, [backHandler])

  const pushRoute = useCallback(
    (routeUrl: string) => {
      const trimmedRoute = `/${routeUrl
        .toLowerCase()
        .replace(URL_SCHEME, '')
        .replace(AUDIUS_SITE_PREFIX, '')
        .replace(AUDIUS_REDIRECT_SITE_PREFIX, '')}`
      if (!webRef.current) return
      postMessage(webRef.current, {
        type: MessageType.PUSH_ROUTE,
        route: trimmedRoute,
        isAction: true
      })
    },
    [webRef]
  )

  const postRecoveryAccount = useCallback(
    ({
      login,
      warning,
      email
    }: {
      login: string | null
      warning: string | null
      email: string | null
    }) => {
      if (!webRef.current) return
      postMessage(webRef.current, {
        type: MessageType.ACCOUNT_RECOVERY,
        login,
        warning,
        email,
        isAction: true
      })
    },
    [webRef]
  )

  const getRecoveryParams = useCallback((recoveryUrl: string) => {
    const urlQueryParams = recoveryUrl.includes('?')
      ? recoveryUrl.split('?').pop()
      : ''
    if (!urlQueryParams) return null
    const urlParams: any = getSearchParams(urlQueryParams)
    const login = urlParams.login
    const warning = urlParams.warning
    const email = urlParams.email
    return { login, warning, email }
  }, [])

  const getSearchParams = (searchString: string) => {
    const queryVars = searchString.split('&')
    return queryVars.reduce((acc: { [key: string]: string }, queryVar) => {
      const pair = queryVar.split('=')
      if (pair.length === 2) {
        acc[pair[0]] = decodeURIComponent(pair[1])
      }
      return acc
    }, {})
  }

  // Handle deep linking when the app is in the background
  useEffect(() => {
    const onOpenURL = (event: any) => {
      if (webRef.current && event.url) {
        const recoveryParams = getRecoveryParams(event.url)
        if (recoveryParams) {
          postRecoveryAccount(recoveryParams)
        } else {
          pushRoute(event.url)
        }
      }
    }
    Linking.addEventListener('url', onOpenURL)
    return () => {
      Linking.removeEventListener('url', onOpenURL)
    }
  }, [webRef, getRecoveryParams, postRecoveryAccount, pushRoute])

  // Handle deep linking when the app is not running
  useEffect(() => {
    if (hasLoaded && webRef.current) {
      Linking.getInitialURL()
        .then(initialUrl => {
          if (initialUrl) {
            const recoveryParams = getRecoveryParams(initialUrl)
            if (recoveryParams) {
              postRecoveryAccount(recoveryParams)
            } else {
              pushRoute(initialUrl)
            }
          }
        })
        .catch(err => console.error('An error occurred', err))
    }
  }, [webRef, hasLoaded, getRecoveryParams, postRecoveryAccount, pushRoute])

  // Handle app state changes from background to foreground and post a message
  const onEnterAppForeground = useCallback(() => {
    if (webRef.current) {
      postMessage(webRef.current, {
        type: MessageType.SYNC_QUEUE,
        info: trackInfo,
        index: trackIndex,
        isAction: true
      })
      postMessage(webRef.current, {
        type: MessageType.ENTER_FOREGROUND,
        isAction: true
      })
    }
    resetServerInterval()
    // Set immediate to give JS context time to be ready
    setImmediate(checkAndRestartServer)
  }, [
    webRef,
    trackInfo,
    trackIndex,
    checkAndRestartServer,
    resetServerInterval
  ])
  useAppState(onEnterAppForeground, () => {})

  // Handle messages coming from the web view
  const onMessageHandler = (event: NativeSyntheticEvent<WebViewMessage>) => {
    if (event.nativeEvent.data) {
      const message = JSON.parse(event.nativeEvent.data)
      if (message.type === MessageType.LOADED) {
        setHasLoaded(true)
      }
      onMessage(
        message,
        // @ts-ignore
        (newMessage: Message) => postMessageUtil(webRef.current, newMessage),
        // @ts-ignore
        reload,
        // @ts-ignore
        state
      )
      return
    }
    console.error('No data found on event')
  }

  const handleShouldStartLoadWithRequest = (event: WebViewNavigation) => {
    let { url: eventUrl } = event
    // First see if it's a link to an Audius page, and redirect
    // within the app if so.
    const audiusPrefixMatches = eventUrl.match(AUDIUS_SITE_PREFIX)
    const audiusPortIncludes = eventUrl.match(AUDIUS_PORT_INCLUDE_PATTERN)
    // For android, empty route redirects here
    if (eventUrl.includes('about:blank')) return false
    if (
      audiusPrefixMatches &&
      audiusPrefixMatches.length &&
      !AUDIUS_WEBLINK_WHITELIST.has(eventUrl)
    ) {
      eventUrl = `/${eventUrl.replace(AUDIUS_SITE_PREFIX, '')}`
      // @ts-ignore
      webRef.current.stopLoading()
      pushRoute(eventUrl)
      return true
    }

    if (audiusPortIncludes && audiusPortIncludes.length) {
      eventUrl = `/${eventUrl.replace('http://localhost:3000/', '')}`
      pushRoute(eventUrl)
      return true
    }

    // Otherwise, if it's not a eventUrl we control, open it
    // in the native browser.
    const matches = eventUrl.match(URL_INTERCEPT_PATTERN)
    if (!matches || !matches.length) {
      // Prevent double encoding of url, this is a problem w/ twitter b/c of the '#' character
      if (!eventUrl.includes('twitter.com/share'))
        eventUrl = encodeURI(eventUrl)
      // @ts-ignore
      webRef.current.stopLoading()
      Linking.openURL(eventUrl)
      return false
    }
    return true
  }

  // Rekey the splash animation if the dapp loading
  // state changes
  const splashKey = useSplashScreenKey(dappLoaded)

  useKeyboardListeners(webRef)

  const [atTop, setAtTop] = useState(true)
  const onScroll = (navState: any) => {
    if (Platform.OS === 'ios') return
    setAtTop(navState.nativeEvent.contentOffset.y <= 1)
  }

  const uri = URL_OVERRIDE || url
  if (!uri) return null
  return (
    <>
      <PullToRefresh webRef={webRef} isAtScrollTop={atTop}>
        <WebView
          // WebView tries to manage the status bar,
          // randomly setting to the wrong color at times.
          // See: https://github.com/react-native-webview/react-native-webview/issues/735
          autoManageStatusBarEnabled={false}
          key={key}
          ref={webRef}
          source={{ uri }}
          decelerationRate='normal' // Default iOS inertial scrolling
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          javaScriptEnabled
          allowFileAccess
          originWhitelist={[
            'https://*',
            'http://*',
            'file://*',
            'sms://*',
            'tel://*',
            'mailto://*'
          ]}
          cacheEnabled={false}
          onScroll={onScroll}
          overScrollMode='never'
          onMessage={onMessageHandler}
          onError={error => console.error(JSON.stringify(error.nativeEvent))}
          onLoad={() => {
            console.log('WebView loaded: ', webRef)
          }}
          onLoadEnd={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent
            const { title, url: eventUrl } = nativeEvent
            if (eventUrl === '' || title === '') reloadViewOnServerError()
          }}
        />
      </PullToRefresh>
      <SplashScreen dappLoaded={dappLoaded} key={`splash-${splashKey}`} />
      {hasLoaded && (
        <NotificationReminder isSignedIn={isSignedIn} webRef={webRef} />
      )}
    </>
  )
}

const useSplashScreenKey = (dappLoaded: boolean) => {
  const [splashKey, setSplashKey] = useState(1)
  useEffect(() => {
    if (!dappLoaded) {
      setSplashKey(k => k + 1)
    }
  }, [dappLoaded])

  return splashKey
}

const mapStateToProps = (state: AppState) => ({
  state,
  trackInfo: getTrack(state),
  trackIndex: getIndex(state),
  isOnFirstPage: getIsOnFirstPage(state),
  isSignedIn: getIsSignedIn(state)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onMessage: (
    message: Message,
    onPostMessage: (message: Message) => void,
    reload: () => void,
    state: AppState
  ) => {
    handleMessage(message, dispatch, onPostMessage, reload, state)
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(WebApp)
