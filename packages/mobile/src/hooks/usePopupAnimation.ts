import { useCallback, useEffect, useRef } from 'react'

import { Animated } from 'react-native'

import {
  BACKGROUND_OPACITY,
  MOUNT_ANIMATION_DURATION_MS,
  REACTION_CONTAINER_HEIGHT,
  UNMOUNT_ANIMATION_DURATION_MS
} from 'app/screens/chat-screen/constants'

export const usePopupAnimation = (
  onClose: () => void
): [Animated.Value, Animated.Value, Animated.Value, () => void] => {
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current
  const otherOpacityAnim = useRef(new Animated.Value(0)).current
  const translationAnim = useRef(
    new Animated.Value(REACTION_CONTAINER_HEIGHT)
  ).current

  const beginMountAnimation = useCallback(() => {
    Animated.parallel(
      [
        Animated.timing(backgroundOpacityAnim, {
          toValue: BACKGROUND_OPACITY,
          useNativeDriver: true,
          duration: MOUNT_ANIMATION_DURATION_MS
        }),
        Animated.timing(otherOpacityAnim, {
          toValue: 1,
          useNativeDriver: true,
          duration: MOUNT_ANIMATION_DURATION_MS
        })
      ],
      { stopTogether: true }
    ).start()
    Animated.spring(translationAnim, {
      toValue: 0,
      useNativeDriver: true
    }).start()
  }, [backgroundOpacityAnim, otherOpacityAnim, translationAnim])

  const beginUnmountAnimation = useCallback(() => {
    Animated.spring(translationAnim, {
      toValue: REACTION_CONTAINER_HEIGHT,
      useNativeDriver: true
    }).start()
    Animated.parallel(
      [
        Animated.timing(backgroundOpacityAnim, {
          toValue: 0,
          useNativeDriver: true,
          duration: UNMOUNT_ANIMATION_DURATION_MS
        }),
        Animated.timing(otherOpacityAnim, {
          toValue: 0,
          useNativeDriver: true,
          duration: UNMOUNT_ANIMATION_DURATION_MS
        })
      ],
      { stopTogether: true }
    ).start(onClose)
  }, [onClose, backgroundOpacityAnim, otherOpacityAnim, translationAnim])

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
