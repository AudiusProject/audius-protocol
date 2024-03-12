import type { NativeSyntheticEvent } from 'react-native'
import { Modal, View, Button } from 'react-native'
import { WebView } from 'react-native-webview'
import type { WebViewMessage } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'

import { env } from 'app/env'
import { closePopup, setCredentials } from 'app/store/oauth/actions'
import { Provider } from 'app/store/oauth/reducer'
import { getUrl, getIsOpen, getAuthProvider } from 'app/store/oauth/selectors'
import type { Credentials } from 'app/store/oauth/types'
import { AUTH_RESPONSE_MESSAGE_TYPE } from 'app/store/oauth/types'

const IDENTITY_SERVICE = env().IDENTITY_SERVICE

const TWITTER_POLLER = `
(function() {
  const exit = () => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: '${AUTH_RESPONSE_MESSAGE_TYPE}'
      })
    )
  }

  const polling = () => {
    try {
      if (
        !window.location.hostname.includes('api.twitter.com') &&
        window.location.hostname !== ''
      ) {
        if (window.location.search) {
          const query = new URLSearchParams(window.location.search)

          const oauthToken = query.get('oauth_token')
          const oauthVerifier = query.get('oauth_verifier')
          if (!oauthToken || !oauthVerifier) exit()

          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: '${AUTH_RESPONSE_MESSAGE_TYPE}',
              oauthToken,
              oauthVerifier
            })
          )
        } else {
          exit()
        }
      }
    } catch (error) {
      exit()
    }
  }

  setInterval(polling, 500)
})();
`

const INSTAGRAM_POLLER = `
(function() {
  const exit = () => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: '${AUTH_RESPONSE_MESSAGE_TYPE}'
      })
    )
  }

  const polling = () => {
    try {
      if (
        window.location.hostname.includes('audius.co')
      ) {
        if (window.location.search) {
          const query = new URLSearchParams(window.location.search)

          const instagramCode = query.get('code')
          if (!instagramCode) exit()

          window.ReactNativeWebView.postMessage(
            JSON.stringify({ 
              type: '${AUTH_RESPONSE_MESSAGE_TYPE}',
              instagramCode
            })
          )
        } else {
          exit()
        }
      }
    } catch (error) {
      exit()
    }
  }

  setInterval(polling, 500)
})();
`

const TIKTOK_POLLER = `
(function() {
  const exit = (error) => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: '${AUTH_RESPONSE_MESSAGE_TYPE}',
        error: error.message
      })
    )
  }

  const getAccessToken = async (authorizationCode, csrfState) => {
    const response = await window.fetch(
      '${IDENTITY_SERVICE}/tiktok/access_token',
      {
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          code: authorizationCode,
          state: csrfState,
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(response.status + ' ' + (await response.text()))
    }

    const {
      data: {
        access_token,
        open_id,
        expires_in
      }
    } = await response.json()

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: '${AUTH_RESPONSE_MESSAGE_TYPE}',
        accessToken: access_token,
        openId: open_id,
        expiresIn: expires_in
      })
    )
  }

  const poll = setInterval(async () => {
    try {
      if (
        window.location.hostname.includes('audius.co')
      ) {
        clearInterval(poll)
        const query = new URLSearchParams(window.location.search || '')

        const authorizationCode = query.get('code')
        const csrfState = query.get('state')
        const error = query.get('error')
        if (authorizationCode && csrfState) {
          await getAccessToken(authorizationCode, csrfState)
        } else {
          exit(new Error(error ||'OAuth redirect has occurred but authorizationCode was not found.'))
        }
      }
    } catch (error) {
      exit(error)
    }
  }, 500)
})();
`

type OAuthWebViewProps = {
  isOpen?: boolean
  url?: string
  provider?: Provider
  onResponse?: (res: any) => void
  onClose?: () => void
}

const OAuthWebView = (props: OAuthWebViewProps) => {
  const { onResponse, onClose } = props
  const dispatch = useDispatch()
  const urlStore = useSelector(getUrl)
  const isOpenStore = useSelector(getIsOpen)
  const providerStore = useSelector(getAuthProvider)

  const useProps = props.isOpen !== undefined
  const { url, isOpen, provider } = useProps
    ? props
    : { url: urlStore, isOpen: isOpenStore, provider: providerStore }

  // Handle messages coming from the web view
  const onMessageHandler = (event: NativeSyntheticEvent<WebViewMessage>) => {
    if (event.nativeEvent.data) {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === AUTH_RESPONSE_MESSAGE_TYPE) {
        const payloadByProvider = {
          [Provider.TWITTER]: (message: any) =>
            message.oauthToken && message.oauthVerifier
              ? {
                  oauthToken: message.oauthToken,
                  oauthVerifier: message.oauthVerifier
                }
              : {},
          [Provider.INSTAGRAM]: (message: any) =>
            message.instagramCode
              ? {
                  code: message.instagramCode
                }
              : {},
          [Provider.TIKTOK]: (message: any) =>
            message.accessToken && message.openId && message.expiresIn
              ? {
                  accessToken: message.accessToken,
                  openId: message.openId,
                  expiresIn: message.expiresIn
                }
              : {
                  error: message.error
                }
        }

        const payload = payloadByProvider[provider as Provider](data)
        onResponse?.(payload)

        dispatch(setCredentials(payload as Credentials))
        dispatch(closePopup(false))
      }
    }
  }

  const handleClose = () => {
    dispatch(closePopup(true))
    onClose?.()
  }

  const injected = {
    [Provider.TWITTER]: TWITTER_POLLER,
    [Provider.INSTAGRAM]: INSTAGRAM_POLLER,
    [Provider.TIKTOK]: TIKTOK_POLLER
  }[provider as Provider]

  return (
    <Modal
      animationType='slide'
      transparent={false}
      visible={isOpen}
      presentationStyle='overFullScreen'
      hardwareAccelerated
    >
      <View style={{ flex: 1, marginTop: 40 }}>
        <View
          style={{
            width: 75,
            marginLeft: 8,
            marginBottom: 8
          }}
        >
          <Button onPress={handleClose} title='Close' />
        </View>
        <WebView
          injectedJavaScript={injected}
          onMessage={onMessageHandler}
          source={{
            uri: url || ''
          }}
        />
      </View>
    </Modal>
  )
}

export default OAuthWebView
