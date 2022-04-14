import { createContext, ReactNode } from 'react'

import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'

type NotificationsDrawerNavigationContextValue =
  | DrawerNavigationHelpers
  | undefined

export const NotificationsDrawerNavigationContext = createContext<
  NotificationsDrawerNavigationContextValue
>(undefined)

export const NotificationsDrawerNavigationContextProvider = ({
  drawerNavigation,
  children
}: {
  drawerNavigation: DrawerNavigationHelpers
  children: ReactNode
}) => {
  return (
    <NotificationsDrawerNavigationContext.Provider value={drawerNavigation}>
      {children}
    </NotificationsDrawerNavigationContext.Provider>
  )
}
