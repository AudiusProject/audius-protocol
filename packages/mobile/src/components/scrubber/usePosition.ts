import { useCallback, useEffect, useRef } from 'react'

import { formatSeconds } from '@audius/common'
import type { TextInput } from 'react-native'

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

  useEffect(() => {
    setPosition(0)
  }, [mediaKey, setPosition])

  return { ref: positionElementRef, setPosition }
}
