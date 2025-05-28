import { useCallback, useState } from 'react'

import type { Screen } from './types'

type UseBuySellScreenProps = {
  onScreenChange: (screen: Screen) => void
  initialScreen?: Screen
}

export const useBuySellScreen = (props: UseBuySellScreenProps) => {
  const { onScreenChange, initialScreen = 'input' } = props
  const [currentScreen, setCurrentScreenInternal] =
    useState<Screen>(initialScreen)

  const setCurrentScreen = useCallback(
    (screen: Screen) => {
      setCurrentScreenInternal(screen)
      onScreenChange(screen)
    },
    [onScreenChange]
  )

  return {
    currentScreen,
    setCurrentScreen
  }
}
