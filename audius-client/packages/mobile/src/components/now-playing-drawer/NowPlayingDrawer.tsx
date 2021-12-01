import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  View,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
  StatusBar
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Drawer from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'

import { DrawerAnimationStyle } from '../drawer/Drawer'

import PlayBar from './PlayBar'

const PLAY_BAR_HEIGHT = 100
const STATUS_BAR_FADE_CUTOFF = 0.6

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 0,
    height: '100%'
  }
})

const attachToDy = (animation: Animated.Value, newValue: number) => (
  e: GestureResponderEvent
) => {
  Animated.event(
    [
      null,
      {
        dy: animation
      }
    ],
    { useNativeDriver: false }
  )(e, { dy: newValue })
}

type NowPlayingDrawerProps = {
  onOpen: () => void
  onClose: () => void
  bottomBarTranslationAnim: Animated.Value
}

const NowPlayingDrawer = ({
  onOpen,
  onClose,
  bottomBarTranslationAnim
}: NowPlayingDrawerProps) => {
  const insets = useSafeAreaInsets()

  const [isOpen, setIsOpen] = useDrawer('NowPlaying')
  const [isPlayBarShowing, setIsPlayBarShowing] = useState(true)

  useEffect(() => {
    if (isOpen) {
      StatusBar.setHidden(true, 'fade')
    } else {
      StatusBar.setHidden(false, 'fade')
    }
  }, [isOpen])

  const onDrawerClose = useCallback(() => {
    setIsOpen(false)
    setIsPlayBarShowing(true)
    onClose()
  }, [setIsOpen, setIsPlayBarShowing, onClose])

  const onDrawerOpen = useCallback(() => {
    setIsOpen(true)
    setIsPlayBarShowing(false)
    onOpen()
  }, [setIsOpen, setIsPlayBarShowing, onOpen])

  const drawerPercentOpen = useRef(0)
  const onDrawerPercentOpen = useCallback(
    (percentOpen: number) => {
      drawerPercentOpen.current = percentOpen
    },
    [drawerPercentOpen]
  )

  // Attach to the pan responder of the drawer so that we can animate away
  // the bottom bar as the drawer is dragged open
  const onPanResponderMove = useCallback(
    (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (gestureState.dy > 0) {
        // Delta is downwards
        if (isOpen) {
          attachToDy(
            bottomBarTranslationAnim,
            drawerPercentOpen.current * 100
          )(e)
        }
      } else if (gestureState.dy < 0) {
        // Delta is upwards
        if (!isOpen) {
          attachToDy(
            bottomBarTranslationAnim,
            drawerPercentOpen.current * 100
          )(e)
        }
      }

      if (gestureState.vy > 0) {
        // Dragging downwards
        if (drawerPercentOpen.current < STATUS_BAR_FADE_CUTOFF) {
          StatusBar.setHidden(false, 'fade')
        }
      } else if (gestureState.vy < 0) {
        // Dragging upwards
        if (drawerPercentOpen.current > STATUS_BAR_FADE_CUTOFF) {
          StatusBar.setHidden(true, 'fade')
        }
      }
    },
    [drawerPercentOpen, bottomBarTranslationAnim, isOpen]
  )

  return (
    <Drawer
      // Appears below bottom bar whereas normally drawers appear above
      zIndex={3}
      isOpen={isOpen}
      onClose={onDrawerClose}
      onOpen={onDrawerOpen}
      initialOffsetPosition={PLAY_BAR_HEIGHT}
      isOpenToInitialOffset={isPlayBarShowing}
      animationStyle={DrawerAnimationStyle.SPRINGY}
      shouldBackgroundDim={false}
      drawerStyle={{ top: -1 * insets.top, overflow: 'visible' }}
      onPercentOpen={onDrawerPercentOpen}
      onPanResponderMove={onPanResponderMove}
    >
      <View style={styles.container}>
        <PlayBar onPress={onDrawerOpen} />
      </View>
    </Drawer>
  )
}

export default NowPlayingDrawer
