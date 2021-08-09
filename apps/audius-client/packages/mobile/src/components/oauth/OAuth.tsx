import React, { RefObject, useCallback } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { WebView } from 'react-native-webview'
import { NativeSyntheticEvent, Modal, View, Button } from 'react-native'

import {
  getUrl,
  getIsOpen,
  getMessageId,
  getAuthProvider,
  getMessageType
} from '../../store/oauth/selectors'
import { AppState } from '../../store'
import { closePopup } from '../../store/oauth/actions'
import { Provider } from '../../store/oauth/reducer'
import { WebViewMessage } from 'react-native-webview/lib/WebViewTypes'
import { MessagePostingWebView } from '../../types/MessagePostingWebView'
import { postMessage } from '../../utils/postMessage'

const AUTH_RESPONSE = 'auth-response'

const TWITTER_POLLER = `
(function() {
  const exit = () => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'auth-response'
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
              type:  'auth-response',
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
        type: 'auth-response'
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
              type:  'auth-response',
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
  const exit = () => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'auth-response'
      })
    )
  }

  setInterval(() => {
    try {
      if (
        window.location.hostname.includes('audius.co')
      ) {
        const query = new URLSearchParams(window.location.search || '')

        const authorizationCode = query.get('code')
        const csrfState = query.get('state')
        const error = query.get('error')
        if (authorizationCode && csrfState) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'auth-response',
              authorizationCode,
              csrfState,
            })
          )
        } else {
          exit()
        }
      }
    } catch {
      exit()
    }
  }, 500)
})();
`

type OwnProps = {
  webRef: RefObject<MessagePostingWebView>
}

type Props = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const OAuth = ({
  url,
  isOpen,
  messageId,
  messageType,
  webRef,
  provider,
  close
}: Props) => {
  // Handle messages coming from the web view
  const onMessageHandler = (event: NativeSyntheticEvent<WebViewMessage>) => {
    if (event.nativeEvent.data && webRef.current) {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === AUTH_RESPONSE) {
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
            message.authorizationCode && message.csrfState
              ? {
                  authorizationCode: message.authorizationCode,
                  csrfState: message.csrfState
                }
              : {}
        }

        postMessage(webRef.current, {
          type: messageType,
          id: messageId,
          ...payloadByProvider[provider as Provider](data)
        })
        close()
      }
    }
  }
  const onClose = useCallback(() => {
    if (webRef.current) {
      postMessage(webRef.current, {
        type: messageType,
        id: messageId
      })
    }
    close()
  }, [webRef, messageId, messageType, close])

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
            marginLeft: 8
          }}
        >
          <Button onPress={onClose} title='Close' />
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

const mapStateToProps = (state: AppState) => ({
  url: getUrl(state),
  isOpen: getIsOpen(state),
  messageId: getMessageId(state),
  messageType: getMessageType(state),
  provider: getAuthProvider(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  close: () => dispatch(closePopup())
})

export default connect(mapStateToProps, mapDispatchToProps)(OAuth)
