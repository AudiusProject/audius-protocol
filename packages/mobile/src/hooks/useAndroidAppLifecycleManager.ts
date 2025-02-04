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
const BACKGROUND_THRESHOLD = 1000 * 60 * 60 // 1 hour

// Heartbeat check interval and timeout
const HEARTBEAT_INTERVAL = 1000 * 60 // 1 minute
const HEARTBEAT_TIMEOUT = 1000 * 60 * 3 // 3 minutes

const checkPlaybackAndRestart = async () => {
  const { state } = await TrackPlayer.getPlaybackState()
  const isPlaying = state === State.Playing

  if (!isPlaying) {
    if (__DEV__) {
      NativeModules.DevSettings.reload()
    } else {
      RNRestart.Restart()
    }
  }
}
const useHeartbeat = () => {
  const heartbeatRef = useRef<number>(Date.now())
  const currentAppState = useAppState()

  useEffectOnce(() => {
    if (Platform.OS !== 'android') return

    // Worker that updates the heartbeat
    const heartbeatInterval = setInterval(() => {
      heartbeatRef.current = Date.now()
    }, HEARTBEAT_INTERVAL)

    // Checker that verifies the heartbeat is recent
    const checkerInterval = setInterval(async () => {
      // Only check if app is active
      if (currentAppState === 'active') {
        const timeSinceLastHeartbeat = Date.now() - heartbeatRef.current

        // If heartbeat is stale and we're active, JS thread might be stuck
        if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
          await checkPlaybackAndRestart()
        }
      }
    }, HEARTBEAT_INTERVAL)

    return () => {
      clearInterval(heartbeatInterval)
      clearInterval(checkerInterval)
    }
  })
}

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

        // Only check for restart if we've been backgrounded for a while
        if (backgroundDuration > BACKGROUND_THRESHOLD) {
          await checkPlaybackAndRestart()
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

export const useAndroidAppLifecycleManager = () => {
  useHeartbeat()
  useRestartStaleApp()
  useForceQuitHandler()
}
