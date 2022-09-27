import { useContext, useEffect } from 'react'

import { useNavigation } from '@react-navigation/core'
import { useDrawerStatus } from '@react-navigation/drawer'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { usePrevious } from 'react-use'

import type { AppTabScreenParamList } from 'app/screens/app-screen'
import { AppTabNavigationContext } from 'app/screens/app-screen'

/**
 * Hook for use in top level stack screens that will reset the stack when the notifications drawer opens.
 * This is needed when the user goes from a notification to a nested stack screen, then swipes back to notifications.
 * When closing the notification drawer the stack will be back at the base screen
 */
export const usePopToTopOnDrawerOpen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppTabScreenParamList>>()
  const isDrawerOpen = useDrawerStatus() === 'open'
  const wasDrawerOpen = usePrevious(isDrawerOpen)
  const { setNavigation } = useContext(AppTabNavigationContext)

  // Sets the navigation context so drawers can push onto current app-tab stack
  useEffect(() => {
    setNavigation(navigation)
  }, [setNavigation, navigation])

  useEffect(() => {
    if (!wasDrawerOpen && isDrawerOpen) {
      if (navigation.getState().routes.length > 1) {
        navigation.popToTop()
      }
    }
  }, [isDrawerOpen, wasDrawerOpen, navigation])
}
