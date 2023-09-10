import { useCallback, useContext } from 'react'

import { useNavigation } from '@react-navigation/core'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { AppTabScreenParamList } from 'app/screens/app-screen'
import { SetAppTabNavigationContext } from 'app/screens/app-screen'

type AppTabNavigation = NativeStackNavigationProp<AppTabScreenParamList>

// Sets the navigation context so drawers can push onto current app-tab stack
export const useAppTabScreen = () => {
  const navigation = useNavigation<AppTabNavigation>()
  const { setNavigation } = useContext(SetAppTabNavigationContext)

  const handleSetNavigation = useCallback(() => {
    setNavigation(navigation)
  }, [setNavigation, navigation])

  useFocusEffect(handleSetNavigation)
}
