import type { ReactNode } from 'react'
import { useMemo, createContext } from 'react'

// eslint-disable-next-line import/no-unresolved
import type { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import type {
  DrawerNavigationState,
  NavigationProp,
  ParamListBase
} from '@react-navigation/native'

type ContextType = {
  drawerHelpers: DrawerNavigationHelpers
  drawerNavigation?: NavigationProp<any>
  gesturesDisabled?: boolean
  setGesturesDisabled?: (gestureDisabled: boolean) => void
  state?: DrawerNavigationState<ParamListBase>
}

type NotificationsDrawerNavigationContextValue =
  | ContextType
  | Record<string, never>

export const NotificationsDrawerNavigationContext =
  createContext<NotificationsDrawerNavigationContextValue>({})

type ProviderProps = ContextType & {
  children: ReactNode
}

export const NotificationsDrawerNavigationContextProvider = (
  props: ProviderProps
) => {
  const {
    children,
    drawerHelpers,
    drawerNavigation,
    gesturesDisabled,
    setGesturesDisabled
  } = props
  const other = useMemo(
    () => ({
      drawerHelpers,
      drawerNavigation,
      gesturesDisabled,
      setGesturesDisabled
    }),
    [drawerHelpers, drawerNavigation, gesturesDisabled, setGesturesDisabled]
  )
  return (
    <NotificationsDrawerNavigationContext.Provider value={other}>
      {children}
    </NotificationsDrawerNavigationContext.Provider>
  )
}
