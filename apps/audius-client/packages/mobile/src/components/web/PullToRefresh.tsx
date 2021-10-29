import React, { ReactNode, useRef, useState, RefObject } from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Animated
} from 'react-native'
import { connect } from 'react-redux'
import { useDarkMode } from 'react-native-dark-mode'

import { light } from '../../haptics'
import { getIsEnabled, getMessageId } from '../../store/web/selectors'
import { AppState } from 'src/store'
import { MessagePostingWebView } from 'src/types/MessagePostingWebView'
import { postMessage } from '../../utils/postMessage'
import { MessageType } from '../../message/types'

// How far the user needs to drag before the refresh fires
const MAX_OFFSET = 140
// Where the animation lives after a refresh
const REFRESHING_OFFSET = 60
// How long in milliseconds that the animation displays for
const MIN_DISPLAY_TIME = 1000
// How far you have to drag to start to see the animation
const ACTIVATION_THRESHOLD = 20

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 5
  }
})

type OwnProps = {
  isAtScrollTop: boolean
  children: ReactNode
  webRef: RefObject<MessagePostingWebView>
}

type Props = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const PullToRefresh = ({
  isAtScrollTop,
  isEnabled,
  messageId,
  webRef,
  children
}: Props) => {
  const isDarkMode = useDarkMode()
  const initial = useRef<number | null>(null)
  const hasReachedTop = useRef(false)

  const [isShowing, setIsShowing] = useState(false)

  const [offset] = useState(new Animated.Value(0))

  const onTouchEvent = (navState: any) => {
    if (isAtScrollTop && isEnabled) {
      const pageY = navState.nativeEvent.pageY
      if (initial.current === null) {
        initial.current = pageY
      }
      if (pageY > initial.current! + ACTIVATION_THRESHOLD) {
        setIsShowing(true)
      }

      if (!hasReachedTop.current && pageY - initial.current! >= MAX_OFFSET) {
        light()
        hasReachedTop.current = true
        if (webRef.current) {
          postMessage(webRef.current, {
            type: MessageType.ENABLE_PULL_TO_REFRESH,
            id: messageId
          })
        }
      }

      Animated.timing(offset, {
        toValue: Math.min(pageY - initial.current!, MAX_OFFSET),
        duration: 0,
        useNativeDriver: true
      }).start()
    }
  }

  const onTouchRelease = (navState: any) => {
    if (hasReachedTop.current) {
      // We passed the cutoff point
      setTimeout(() => {
        initial.current = null
        setIsShowing(false)
      }, MIN_DISPLAY_TIME)

      Animated.spring(offset, {
        toValue: REFRESHING_OFFSET,
        useNativeDriver: true
      }).start()
    } else {
      // We haven't passed the cutoff point
      initial.current = null
      setIsShowing(false)
    }

    hasReachedTop.current = false
  }

  if (Platform.OS === 'ios') return <>{children}</>

  return (
    <View
      style={{ width: '100%', height: '100%' }}
      onStartShouldSetResponder={ev => true}
      onMoveShouldSetResponder={ev => true}
      onResponderMove={onTouchEvent}
      onResponderRelease={onTouchRelease}
      onResponderTerminationRequest={ev => true}
    >
      {/* <View
        // This is the right solution to disabling touches while
        // pulling to refresh, but it causes a weird repaint only on load
        style={{width: '100%', height: '100%'}}
        // pointerEvents={isShowing ? 'none' : 'auto'}
      > */}
      {children}
      {/* </View> */}
      {isShowing && (
        <Animated.View
          style={{ ...styles.container, transform: [{ translateY: offset }] }}
        >
          <View
            style={{
              ...styles.touchable,
              backgroundColor: isDarkMode ? '#242438' : '#FCFCFC'
            }}
          >
            <Animated.View
              style={{
                opacity: offset.interpolate({
                  inputRange: [0, REFRESHING_OFFSET],
                  outputRange: [0, 1]
                })
              }}
            >
              <ActivityIndicator
                animating
                size='large'
                color={isDarkMode ? '#C74BD3' : '#CC0FE0'}
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  )
}

const mapStateToProps = (state: AppState) => ({
  isEnabled: getIsEnabled(state),
  messageId: getMessageId(state)
})

const mapDispatchToProps = () => ({})

// @ts-ignore: we can potentially just return children
export default connect(mapStateToProps, mapDispatchToProps)(PullToRefresh)
