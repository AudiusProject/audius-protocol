import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import {
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  View
} from 'react-native'

import { AppState } from '../../store'
import { MessagePostingWebView } from '../../types/MessagePostingWebView'
import { getIsOpen } from '../../store/notifications/selectors'
import * as notificationsActions from '../../store/notifications/actions'
import { getIsSignedIn } from '../../store/lifecycle/selectors'
import TopBar from './TopBar'
import List from './List'
import { postMessage } from '../../utils/postMessage'
import { MessageType } from '../../message'
import { useTheme } from '../../utils/theme'
import useAppState from '../../utils/useAppState'
import useLocation from '../../utils/useLocation'

const INITIAL_OFFSET = 10
const MAX_BG_OPACITY = 0.3
const ON_MOVE_RESPONDER_DX = 20
const ON_MOVE_RESPONDER_DY = 10
const MOVE_CUTOFF_CLOSE = 0.8
const MOVE_CUTOFF_OPEN = 0.2

const styles = StyleSheet.create({
  animator: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    elevation: 1,
    zIndex: 2
  },
  container: {
    flex: 1,
    position: 'absolute',
    left: -1 * INITIAL_OFFSET,
    top: 0,
    width: '100%',
    height: '100%'
  },
  background: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    backgroundColor: '#000000'
  }
})

type OwnProps = {
  webRef: RefObject<MessagePostingWebView>
}

type NotificationsProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

/**
 * A component that renders a user's notifications in a
 * slide out panel.
 */
const Notifications = ({
  webRef,
  isSignedIn,
  isOpen,
  open,
  close,
  markAsViewed
}: NotificationsProps) => {
  const onLoadMore = useCallback(() => {
    if (webRef.current) {
      postMessage(webRef.current, {
        type: MessageType.FETCH_NOTIFICATIONS,
        isAction: true
      })
    }
  }, [webRef])

  const onRefresh = useCallback(() => {
    if (webRef.current) {
      postMessage(webRef.current, {
        type: MessageType.REFRESH_NOTIFICATIONS,
        isAction: true
      })
    }
  }, [webRef])

  const { width } = Dimensions.get('window')
  const initialPosition = -1 * width + INITIAL_OFFSET

  const translationAnim = useRef(new Animated.Value(initialPosition)).current
  const backgroundAnim = useRef(new Animated.Value(0)).current

  const slideIn = useCallback(() => {
    Animated.spring(translationAnim, {
      toValue: INITIAL_OFFSET,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()
    Animated.timing(backgroundAnim, {
      toValue: MAX_BG_OPACITY,
      duration: 300,
      useNativeDriver: true
    }).start()
  }, [backgroundAnim, translationAnim])

  const slideOut = useCallback(() => {
    Animated.spring(translationAnim, {
      toValue: initialPosition,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()
    Animated.timing(backgroundAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start()
    close()
    markAsViewed()
  }, [initialPosition, close, markAsViewed, backgroundAnim, translationAnim])

  useAppState(
    () => {},
    () => {
      if (isOpen) {
        slideIn()
      } else {
        slideOut()
      }
    }
  )

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return (
        Math.abs(gestureState.dx) > ON_MOVE_RESPONDER_DX &&
        Math.abs(gestureState.dy) < ON_MOVE_RESPONDER_DY
      )
    },
    onPanResponderMove: (e, gestureState) => {
      if (isOpen) {
        if (gestureState.dx < 0) {
          Animated.event(
            [
              null,
              {
                dx: translationAnim
              }
            ],
            { useNativeDriver: false }
          )(e, { dx: gestureState.dx })

          Animated.event(
            [
              null,
              {
                moveX: backgroundAnim
              }
            ],
            { useNativeDriver: false }
          )(e, { moveX: Math.min(gestureState.moveX / width, MAX_BG_OPACITY) })
        }
      } else {
        if (gestureState.dx > 0) {
          Animated.event(
            [
              null,
              {
                dx: translationAnim
              }
            ],
            { useNativeDriver: false }
          )(e, {
            dx: Math.min(INITIAL_OFFSET, initialPosition + gestureState.dx)
          })

          Animated.event(
            [
              null,
              {
                moveX: backgroundAnim
              }
            ],
            { useNativeDriver: false }
          )(e, { moveX: Math.min(gestureState.moveX / width, MAX_BG_OPACITY) })
        }
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (isOpen) {
        // Close if open & drag is past cutoff
        if (
          gestureState.vx < 0 &&
          gestureState.moveX < MOVE_CUTOFF_CLOSE * width
        ) {
          slideOut()
        } else {
          slideIn()
        }
      } else {
        // Open if closed & drag is past cutoff
        if (
          gestureState.vx > 0 &&
          gestureState.moveX > MOVE_CUTOFF_OPEN * width
        ) {
          slideIn()
          open()
        } else {
          slideOut()
        }
      }
    }
  })

  const onGoToRoute = useCallback(
    (route: string) => {
      if (webRef.current) {
        postMessage(webRef.current, {
          type: MessageType.PUSH_ROUTE,
          route,
          isAction: true
        })
      }
      slideOut()
    },
    [webRef, slideOut]
  )

  const [anchorRoute, setAnchorRoute] = useState<string | null>(null)
  const onClickTopBarClose = useCallback(() => {
    if (webRef.current) {
      postMessage(webRef.current, {
        type: MessageType.PUSH_ROUTE,
        route: anchorRoute || '/',
        isAction: true
      })
      setAnchorRoute(null)
    }
    slideOut()
  }, [webRef, slideOut, anchorRoute])

  const { pathname, state } = useLocation() || {}
  const isMainRoute =
    pathname &&
    (pathname === '/feed' ||
      pathname === '/trending' ||
      pathname === '/explore' ||
      pathname === '/favorites' ||
      pathname.startsWith('/search'))
  const isFromNativeNotifications = state?.fromNativeNotifications ?? false
  const canShowNotifications =
    (isMainRoute || isFromNativeNotifications) && isSignedIn

  useEffect(() => {
    if (isOpen) {
      slideIn()
      if (!anchorRoute) {
        setAnchorRoute(pathname)
      }
    }
  }, [isOpen, slideIn, anchorRoute, pathname, setAnchorRoute])

  const containerStyle = useTheme(styles.container, {
    backgroundColor: 'background'
  })

  const panProps = canShowNotifications ? panResponder.panHandlers : {}

  return (
    <>
      {/* animated drawer */}
      <Animated.View
        {...panProps}
        style={[
          styles.animator,
          {
            transform: [
              {
                translateX: translationAnim
              }
            ]
          }
        ]}
      >
        <View style={containerStyle}>
          <TopBar onClose={onClickTopBarClose} />
          <List
            onLoadMore={onLoadMore}
            onRefresh={onRefresh}
            onGoToRoute={onGoToRoute}
          />
        </View>
      </Animated.View>

      {/* background overlay */}
      <Animated.View
        pointerEvents='none'
        style={[
          styles.background,
          {
            opacity: backgroundAnim
          }
        ]}
      />
    </>
  )
}

const mapStateToProps = (state: AppState) => ({
  isOpen: getIsOpen(state),
  isSignedIn: getIsSignedIn(state)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  open: () => dispatch(notificationsActions.open()),
  close: () => dispatch(notificationsActions.close()),
  markAsViewed: () => dispatch(notificationsActions.markAsViewed())
})

export default connect(mapStateToProps, mapDispatchToProps)(Notifications)
