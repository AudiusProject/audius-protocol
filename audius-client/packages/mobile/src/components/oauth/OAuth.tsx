import React, { RefObject, useCallback } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { WebView } from 'react-native-webview'
import { NativeSyntheticEvent, Modal, View, Button } from 'react-native'

import {
  getUrl,
  getIsOpen,
  getMessageId,
  getAuthProvider
} from '../../store/oauth/selectors'
import { AppState } from '../../store'
import { closePopup } from '../../store/oauth/actions'
import { Provider } from '../../store/oauth/reducer'
import { WebViewMessage } from 'react-native-webview/lib/WebViewTypes'
import { MessageType } from '../../message'
import { MessagePostingWebView } from '../../types/MessagePostingWebView'
import { postMessage } from '../../utils/postMessage'

const TWITTER_POLLER = `
(function() {
  const exit = () => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({})
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
      JSON.stringify({})
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
            JSON.stringify({ instagramCode })
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

type OwnProps = {
  webRef: RefObject<MessagePostingWebView>
}

type Props = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const OAuth = ({ url, isOpen, messageId, webRef, provider, close }: Props) => {
  // Handle messages coming from the web view
  const onMessageHandler = (event: NativeSyntheticEvent<WebViewMessage>) => {
    if (event.nativeEvent.data && webRef.current) {
      const message = JSON.parse(event.nativeEvent.data)
      if (provider === Provider.TWITTER) {
        if (message.oauthToken && message.oauthVerifier) {
          postMessage(webRef.current, {
            type: MessageType.REQUEST_TWITTER_AUTH,
            id: messageId,
            oauthToken: message.oauthToken,
            oauthVerifier: message.oauthVerifier
          })
        } else {
          postMessage(webRef.current, {
            type: MessageType.REQUEST_TWITTER_AUTH,
            id: messageId
          })
        }
      } else if (provider === Provider.INSTAGRAM) {
        if (message.instagramCode) {
          postMessage(webRef.current, {
            type: MessageType.REQUEST_INSTAGRAM_AUTH,
            id: messageId,
            code: message.instagramCode
          })
        } else {
          postMessage(webRef.current, {
            type: MessageType.REQUEST_INSTAGRAM_AUTH,
            id: messageId
          })
        }
      }
    }
    close()
  }
  const onClose = useCallback(() => {
    if (provider === Provider.TWITTER && webRef.current) {
      postMessage(webRef.current, {
        type: MessageType.REQUEST_TWITTER_AUTH,
        id: messageId
      })
    }

    if (provider === Provider.INSTAGRAM && webRef.current) {
      postMessage(webRef.current, {
        type: MessageType.REQUEST_INSTAGRAM_AUTH,
        id: messageId
      })
    }
    close()
  }, [webRef, messageId, close, provider])

  const injected =
    provider === Provider.INSTAGRAM ? INSTAGRAM_POLLER : TWITTER_POLLER
  return (
    <Modal
      animationType='slide'
      transparent={false}
      visible={isOpen}
      presentationStyle='overFullScreen'
      hardwareAccelerated
    >
      <View style={{ flex: 1, marginTop: 20 }}>
        <View
          style={{
            height: 40,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            paddingTop: 6,
            paddingLeft: 6,
            paddingBottom: 6,
            marginTop: 10
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
  provider: getAuthProvider(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  close: () => dispatch(closePopup())
})

export default connect(mapStateToProps, mapDispatchToProps)(OAuth)
