import { useCallback, useEffect, useRef } from 'react'

import { formatSeconds } from '@audius/common'
import { useAppState } from '@react-native-community/hooks'
import type { TextInput } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import { useAsync } from 'react-use'

export const usePosition = (
  mediaKey: string,
  duration: number,
  isPlaying: boolean,
  isInteracting: boolean
) => {
  const positionRef = useRef(0)
  const positionElementRef = useRef<TextInput>(null)

  const setPosition = useCallback((position: number) => {
    positionRef.current = position
    positionElementRef.current?.setNativeProps({
      text: formatSeconds(positionRef.current)
    })
  }, [])

  useEffect(() => {
    let currentTimeout: number

    const updatePosition = () => {
      const timeout = setTimeout(() => {
        positionRef.current += 1

        positionElementRef.current?.setNativeProps({
          text: formatSeconds(positionRef.current)
        })

        if (positionRef.current <= duration) {
          currentTimeout = updatePosition()
        }
      }, 1000)

      return timeout
    }

    if (isPlaying && !isInteracting) {
      currentTimeout = updatePosition()
    }

    return () => {
      clearTimeout(currentTimeout)
    }
  }, [isPlaying, isInteracting, duration])

  // Android pauses timeouts when in background, so we use app state
  // to trigger a position coercion
  const appState = useAppState()

  useAsync(async () => {
    if (appState === 'active') {
      positionRef.current = await TrackPlayer.getPosition()
    }
  }, [appState])

  useEffect(() => {
    setPosition(0)
  }, [mediaKey, setPosition])

  return { ref: positionElementRef, setPosition }
}
