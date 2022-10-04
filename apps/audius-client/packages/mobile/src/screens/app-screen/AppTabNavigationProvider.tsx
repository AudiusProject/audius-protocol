import type { ReactNode } from 'react'
import { useMemo, createContext, useState } from 'react'

import type { Nullable } from '@audius/common'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { AppTabScreenParamList } from './AppTabScreen'

type AppTabNavigation = NativeStackNavigationProp<AppTabScreenParamList>

type AppTabNavigationContextValue = {
  navigation: Nullable<AppTabNavigation>
}

export const AppTabNavigationContext =
  createContext<AppTabNavigationContextValue>({
    navigation: null
  })

type SetAppTabNavigationContextValue = {
  setNavigation: (navigation: AppTabNavigation) => void
}

export const SetAppTabNavigationContext =
  createContext<SetAppTabNavigationContextValue>({
    setNavigation: () => {}
  })

type AppTabNavigationProviderProps = { children: ReactNode }

export const AppTabNavigationProvider = (
  props: AppTabNavigationProviderProps
) => {
  const { children } = props
  const [navigation, setNavigation] = useState<Nullable<AppTabNavigation>>(null)

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
