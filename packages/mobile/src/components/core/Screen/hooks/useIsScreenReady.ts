import { useCallback, useState } from 'react'

import { useFocusEffect } from '@react-navigation/native'
import { InteractionManager } from 'react-native'

const SCHEDULING_DELAY = 1

// Maximum delay before allowing the screen to render
const RESET_DELAY = 200

export const useIsScreenReady = () => {
  const [isReady, setIsReady] = useState(false)

  // Runs each time the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Scheduled with minimal delay to keep the callback from interrupting interactions
      const interactionTimer = setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          setIsReady(true)
        })
      }, SCHEDULING_DELAY)

      // Failsafe to ensure the screen is never left in a loading state
      // This puts a cap on the performance impact of this hook
      const resetTimer = setTimeout(() => {
        clearTimeout(interactionTimer)
        setIsReady(true)
      }, RESET_DELAY)

      // Stop tracking if the screen loses focus
      return () => {
        clearTimeout(interactionTimer)
        clearTimeout(resetTimer)
        setIsReady(true)
      }
    }, [])
  )

  return isReady
}
