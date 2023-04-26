import type { MutableRefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'

import { Animated } from 'react-native'

import {
  BACKGROUND_OPACITY,
  MOUNT_ANIMATION_DURATION_MS,
  UNMOUNT_ANIMATION_DURATION_MS,
  REACTION_CONTAINER_HEIGHT
} from 'app/screens/chat-screen/constants'

export const usePopupAnimation = (
  onClose: () => void
): [
  MutableRefObject<Animated.Value>,
  MutableRefObject<Animated.Value>,
  MutableRefObject<Animated.Value>,
  () => void
] => {
  const backgroundOpacityAnim = useRef(new Animated.Value(0))
  const otherOpacityAnim = useRef(new Animated.Value(0))
  const translationAnim = useRef(new Animated.Value(REACTION_CONTAINER_HEIGHT))
  const beginMountAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(backgroundOpacityAnim.current, {
        toValue: BACKGROUND_OPACITY,
        useNativeDriver: true,
        duration: MOUNT_ANIMATION_DURATION_MS
      }),
      Animated.timing(otherOpacityAnim.current, {
        toValue: 1,
        useNativeDriver: true,
        duration: MOUNT_ANIMATION_DURATION_MS
      }),
      Animated.spring(translationAnim.current, {
        toValue: 0,
        useNativeDriver: true
      })
    ]).start()
  }, [])

  const beginUnmountAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(backgroundOpacityAnim.current, {
        toValue: 0,
        useNativeDriver: true,
        duration: UNMOUNT_ANIMATION_DURATION_MS
      }),
      Animated.timing(otherOpacityAnim.current, {
        toValue: 0,
        useNativeDriver: true,
        duration: UNMOUNT_ANIMATION_DURATION_MS
      })
    ]).start(onClose)
    Animated.spring(translationAnim.current, {
      toValue: REACTION_CONTAINER_HEIGHT,
      useNativeDriver: true
    }).start()
  }, [onClose])

  useEffect(() => {
    beginMountAnimation()
  }, [beginMountAnimation])

  const handleClosePopup = useCallback(() => {
    beginUnmountAnimation()
  }, [beginUnmountAnimation])

  return [
    backgroundOpacityAnim,
    otherOpacityAnim,
    translationAnim,
    handleClosePopup
  ]
}
