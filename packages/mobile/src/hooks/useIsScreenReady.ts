import { useEffect, useState } from 'react'

import { useNavigation } from './useNavigation'

export const useIsScreenReady = () => {
  const [isReady, setIsReady] = useState(false)
  const navigation = useNavigation()
  useEffect(() => {
    // Listener for the end of the transition animation
    const unsubscribe = navigation.addListener('transitionEnd', (e) => {
      setIsReady(true)
    })

    return unsubscribe
  }, [navigation])

  return isReady
}
