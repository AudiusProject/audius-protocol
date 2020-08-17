import React, { RefObject } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { WebView } from 'react-native-webview'
import { NativeSyntheticEvent, Modal, View, Button } from 'react-native'

import { getUrl, getIsOpen, getMessageId } from '../../store/oauth/selectors'
import { AppState } from '../../store'
import { closePopup } from '../../store/oauth/actions'
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
  webRef,
  close
}: Props) => {

  // Handle messages coming from the web view
  const onMessageHandler = (event: NativeSyntheticEvent<WebViewMessage>) => {
    if (event.nativeEvent.data) {
      const message = JSON.parse(event.nativeEvent.data)
      if (message.oauthToken && message.oauthVerifier) {
        if (!webRef.current) return
        postMessage(webRef.current, {
          type: MessageType.REQUEST_TWITTER_AUTH,
          id: messageId,
          oauthToken: message.oauthToken,
          oauthVerifier: message.oauthVerifier
        })
      }
    }
    close()
  }

  return (
    <Modal
      animationType='slide'
      transparent={false}
      visible={isOpen}
      presentationStyle='overFullScreen'
      hardwareAccelerated
    >
      <View style={{ flex: 1, marginTop: 20 }}>
        <View style={{
          height: 40,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          paddingTop: 6,
          paddingLeft: 6,
          paddingBottom: 6,
          marginTop: 10
        }}>
          <Button
            onPress={close}
            title='Close'
          >
          </Button>
        </View>
        <WebView
          injectedJavaScript={TWITTER_POLLER}
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
  messageId: getMessageId(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  close: () => dispatch(closePopup())
})

export default connect(mapStateToProps, mapDispatchToProps)(OAuth)
