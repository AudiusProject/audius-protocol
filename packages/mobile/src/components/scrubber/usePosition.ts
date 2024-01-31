import { useCallback, useEffect, useRef } from 'react'

import { playerSelectors, playbackRateValueMap } from '@audius/common/store'
import { formatSeconds } from '@audius/common/utils'
import { useAppState } from '@react-native-community/hooks'
import type { TextInput } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

const { getPlaybackRate, getSeek, getSeekCounter, getCounter } = playerSelectors

export const usePosition = (
  mediaKey: string,
  duration: number,
  isPlaying: boolean,
  isInteracting: boolean
) => {
  const positionRef = useRef(0)
  const positionElementRef = useRef<TextInput>(null)
  const playbackRate = useSelector(getPlaybackRate)
  const seek = useSelector(getSeek)
  const seekCounter = useSelector(getSeekCounter)
  const counter = useSelector(getCounter)

  const setPosition = useCallback((position: number) => {
    positionRef.current = position
    positionElementRef.current?.setNativeProps({
      text: formatSeconds(positionRef.current)
    })
  }, [])

  useEffect(() => {
    let currentTimeout: ReturnType<typeof setTimeout>

    const updatePosition = () => {
      const timeout = setTimeout(async () => {
        positionRef.current += 1

        positionElementRef.current?.setNativeProps({
          text: formatSeconds(positionRef.current)
        })

        if (positionRef.current <= duration) {
          currentTimeout = updatePosition()
        }
      }, 1000 / playbackRateValueMap[playbackRate])

      return timeout
    }

    if (isPlaying && !isInteracting) {
      currentTimeout = updatePosition()
    }

    return () => {
      clearTimeout(currentTimeout)
    }
  }, [isPlaying, isInteracting, duration, playbackRate, counter])

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

  useEffect(() => {
    if (seek !== null) setPosition(seek)
  }, [seek, seekCounter, setPosition])

  return { ref: positionElementRef, setPosition }
}
