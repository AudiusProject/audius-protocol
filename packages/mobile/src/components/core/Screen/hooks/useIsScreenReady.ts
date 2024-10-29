import { useCallback, useState } from 'react'

import { useFocusEffect } from '@react-navigation/native'
import { InteractionManager } from 'react-native'

export const useIsScreenReady = () => {
  const delay = 1
  const [isReady, setIsReady] = useState(false)

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          setIsReady(true)
        })
      }, delay)

      setTimeout(() => {
        clearTimeout(timer)
        setIsReady(true)
      }, 200)

      // Reset the state when screen loses focus
      return () => {
        clearTimeout(timer)
        setIsReady(false)
      }
    }, [])
  )

  return isReady
}
