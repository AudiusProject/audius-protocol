import type { ReactNode } from 'react'
import { useMemo, createContext, useState } from 'react'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { AppTabScreenParamList } from './AppTabScreen'

export type AppTabNavigation = NativeStackNavigationProp<AppTabScreenParamList>

type AppTabNavigationContextValue = {
  navigation: AppTabNavigation
}

export const AppTabNavigationContext =
  createContext<AppTabNavigationContextValue>({
    navigation: {} as AppTabNavigation
  })

type SetAppTabNavigationContextValue = {
  setNavigation: (navigation: AppTabNavigation) => void
}

export const SetAppTabNavigationContext =
  createContext<SetAppTabNavigationContextValue>({
    setNavigation: () => {}
  })

type AppTabNavigationProviderProps = { children: ReactNode }

/**
 * Context that provides the AppTabNavigation to any components
 * that need it outside of the AppTabScreen stack context
 */
export const AppTabNavigationProvider = (
  props: AppTabNavigationProviderProps
) => {
  const { children } = props
  const [navigation, setNavigation] = useState({} as AppTabNavigation)

  const navigationContext = useMemo(
    () => ({ navigation, setNavigation }),
    [navigation, setNavigation]
  )

  const setNavigationContext = useMemo(
    () => ({ setNavigation }),
    [setNavigation]
  )

  return (
    <AppTabNavigationContext.Provider value={navigationContext}>
      <SetAppTabNavigationContext.Provider value={setNavigationContext}>
        {children}
      </SetAppTabNavigationContext.Provider>
    </AppTabNavigationContext.Provider>
  )
}
