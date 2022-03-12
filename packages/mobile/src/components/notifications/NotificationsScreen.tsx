import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { markAllAsViewed } from 'audius-client/src/common/store/notifications/actions'
import {
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  View
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import useIsStackOpen from 'app/hooks/useIsStackOpen'
import { getIsSignedIn } from 'app/store/lifecycle/selectors'
import * as notificationsActions from 'app/store/notifications/actions'
import { getIsOpen } from 'app/store/notifications/selectors'
import { useTheme } from 'app/utils/theme'

import { List } from './List'
import TopBar from './TopBar'

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

type DrawerStatus = 'open' | 'opening' | 'closed' | 'closing'

/**
 * A component that renders a user's notifications in a
 * slide out panel.
 */
export const NotificationsScreen = () => {
  const isOpen = useSelector(getIsOpen)
  const isSignedIn = useSelector(getIsSignedIn)
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const isStackOpen = useIsStackOpen()
  const [drawerStatus, setDrawerStatus] = useState<DrawerStatus>('closed')
  const previousDrawerStatus = usePrevious(drawerStatus)

  useEffect(() => {
    setDrawerStatus(isOpen ? 'open' : 'closed')
  }, [isOpen])

  const handleOpen = useCallback(() => {
    dispatch(notificationsActions.open())
  }, [dispatch])

  const handleClose = useCallback(() => {
    setDrawerStatus('closing')
  }, [])

  const handleClosed = useCallback(() => {
    dispatch(notificationsActions.close())
    dispatchWeb(markAllAsViewed())
  }, [dispatch, dispatchWeb])

  const { width } = Dimensions.get('window')

  // When a navigation stack is open, don't allow the notifications to be opened
  // by adjusting the offset
  const initialPosition = useMemo(
    () => -1 * width + (isStackOpen ? 0 : INITIAL_OFFSET),
    [width, isStackOpen]
  )

  const translationAnim = useRef(new Animated.Value(initialPosition)).current
  const backgroundAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    translationAnim.setValue(initialPosition)
  }, [translationAnim, initialPosition])

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
    }).start(handleClosed)
    Animated.timing(backgroundAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start()
    handleClose()
  }, [
    initialPosition,
    handleClosed,
    handleClose,
    backgroundAnim,
    translationAnim
  ])

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return (
        Math.abs(gestureState.dx) > ON_MOVE_RESPONDER_DX &&
        Math.abs(gestureState.dy) < ON_MOVE_RESPONDER_DY
      )
    },
    onPanResponderMove: (e, gestureState) => {
      if (drawerStatus === 'open') {
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
          setDrawerStatus('opening')
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
      if (drawerStatus === 'open') {
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
          handleOpen()
        } else {
          slideOut()
        }
      }
    }
  })

  const onClickTopBarClose = useCallback(() => {
    slideOut()
  }, [slideOut])

  useEffect(() => {
    if (drawerStatus === 'open') {
      slideIn()
    }
  }, [drawerStatus, slideIn])

  // Drawer was requested to be closed from an external source
  useEffect(() => {
    if (previousDrawerStatus === 'open' && drawerStatus === 'closed') {
      slideOut()
    }
  }, [drawerStatus, previousDrawerStatus, slideOut])

  const containerStyle = useTheme(styles.container, {
    backgroundColor: 'background'
  })

  const panProps = panResponder.panHandlers

  return isSignedIn ? (
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
          <List />
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
  ) : null
}
