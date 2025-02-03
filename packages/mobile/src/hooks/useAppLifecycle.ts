import { useRef } from 'react'

import { useAppState } from '@react-native-community/hooks'
import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import RNRestart from 'react-native-restart'
import TrackPlayer, { State } from 'react-native-track-player'
import { useAsync, useEffectOnce } from 'react-use'

const eventEmitter = new NativeEventEmitter(
  NativeModules.DeviceEventManagerModule
)

// Time in milliseconds after which we consider the app to be "long backgrounded"
const BACKGROUND_THRESHOLD = 1000 * 60 * 5 // 5 minutes

const useRestartStaleApp = () => {
  const backgroundTimeRef = useRef<number | null>(null)
  const currentAppState = useAppState()
  const prevAppStateRef = useRef(currentAppState)

  useAsync(async () => {
    if (Platform.OS !== 'android') return

    // Handle entering background
    if (
      prevAppStateRef.current === 'active' &&
      currentAppState === 'background'
    ) {
      backgroundTimeRef.current = Date.now()
    }

    // Handle entering foreground
    if (
      prevAppStateRef.current === 'background' &&
      currentAppState === 'active'
    ) {
      if (backgroundTimeRef.current) {
        const backgroundDuration = Date.now() - backgroundTimeRef.current
        backgroundTimeRef.current = null
        const { state } = await TrackPlayer.getPlaybackState()
        const isPlaying = state === State.Playing

        // If media is not playing and app was backgrounded longer than threshold
        if (!isPlaying && backgroundDuration > BACKGROUND_THRESHOLD) {
          // Use RN's DevSettings to reload the app (only works in debug builds)
          if (__DEV__) {
            NativeModules.DevSettings.reload()
          } else {
            // Use react-native-restart to restart the app in production
            RNRestart.Restart()
          }
        }
      }
    }

    prevAppStateRef.current = currentAppState
  }, [currentAppState])
}

const useForceQuitHandler = () => {
  useEffectOnce(() => {
    const subscription = eventEmitter.addListener(
      'ForceQuitDetected',
      async () => {
        RNRestart.Restart()
      }
    )

    return () => subscription.remove()
  })
}

export const useAppLifecycle = () => {
  useRestartStaleApp()
  useForceQuitHandler()
}
