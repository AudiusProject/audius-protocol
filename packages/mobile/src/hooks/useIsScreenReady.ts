import { useCallback, useState } from 'react'

import { useFocusEffect } from '@react-navigation/native'
import { InteractionManager } from 'react-native'

import { useNavigation } from './useNavigation'

export const useIsScreenReady = () => {
  const delay = 1
  const [isReady, setIsReady] = useState(false)
  const navigation = useNavigation()

  useFocusEffect(
    useCallback(() => {
      let timer
      const unsubscribe = navigation.addListener('transitionEnd', (e) => {
        timer = setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            setIsReady(true)
          })
        }, delay)
      })

      // Reset the state when screen loses focus
      return () => {
        clearTimeout(timer)
        unsubscribe()
        setIsReady(false)
      }
    }, [navigation])
  )

  return isReady
}
