import { createContext, ReactNode } from 'react'

import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import { NavigationProp } from '@react-navigation/native'

type NotificationsDrawerNavigationContextValue =
  | {
      drawerHelpers: DrawerNavigationHelpers
      drawerNavigation?: NavigationProp<any>
    }
  | Record<string, never>

export const NotificationsDrawerNavigationContext = createContext<
  NotificationsDrawerNavigationContextValue
>({})

export const NotificationsDrawerNavigationContextProvider = ({
  drawerHelpers,
  drawerNavigation,
  children
}: {
  drawerHelpers: DrawerNavigationHelpers
  drawerNavigation?: NavigationProp<any>
  children: ReactNode
}) => {
  return (
    <NotificationsDrawerNavigationContext.Provider
      value={{ drawerHelpers, drawerNavigation }}
    >
      {children}
    </NotificationsDrawerNavigationContext.Provider>
  )
}
