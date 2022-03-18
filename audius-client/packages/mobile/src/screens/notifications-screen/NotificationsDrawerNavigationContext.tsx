import { createContext, ReactNode } from 'react'

import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'

type NotificationsDrawerNavigationContextProps = {
  drawerNavigation: DrawerNavigationHelpers | undefined
}

export const NotificationsDrawerNavigationContext = createContext<
  NotificationsDrawerNavigationContextProps
>({
  drawerNavigation: undefined
})

export const NotificationsDrawerNavigationContextProvider = ({
  drawerNavigation,
  children
}: {
  drawerNavigation: DrawerNavigationHelpers
  children: ReactNode
}) => {
  return (
    <NotificationsDrawerNavigationContext.Provider
      value={{
        drawerNavigation
      }}
    >
      {children}
    </NotificationsDrawerNavigationContext.Provider>
  )
}
