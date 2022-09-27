import type { ReactNode } from 'react'
import { useMemo, createContext, useState } from 'react'

import type { Nullable } from '@audius/common'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { AppTabScreenParamList } from './AppTabScreen'

type AppTabNavigation = NativeStackNavigationProp<AppTabScreenParamList>

type AppTabNavigationContextValue = {
  navigation: Nullable<AppTabNavigation>
  setNavigation: (navigation: AppTabNavigation) => void
}

export const AppTabNavigationContext =
  createContext<AppTabNavigationContextValue>({
    navigation: null,
    setNavigation: () => {}
  })

type AppTabNavigationProviderProps = { children: ReactNode }

export const AppTabNavigationProvider = (
  props: AppTabNavigationProviderProps
) => {
  const { children } = props
  const [navigation, setNavigation] = useState<Nullable<AppTabNavigation>>(null)

  const context = useMemo(
    () => ({ navigation, setNavigation }),
    [navigation, setNavigation]
  )

  return (
    <AppTabNavigationContext.Provider value={context}>
      {children}
    </AppTabNavigationContext.Provider>
  )
}
