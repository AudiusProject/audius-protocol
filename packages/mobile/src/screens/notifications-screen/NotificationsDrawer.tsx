import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useNavigation } from '@react-navigation/native'

import { AppDrawerContextProvider } from '../app-drawer-screen'

import { NotificationsDrawerScreen } from './NotificationsDrawerScreen'

type NotificationDrawerContentsProps = DrawerContentComponentProps & {
  gesturesDisabled: boolean
  setGesturesDisabled: (disabled: boolean) => void
}

/**
 * The content of the notifications drawer, which swipes in
 */
export const NotificationsDrawer = (props: NotificationDrawerContentsProps) => {
  const {
    navigation: drawerHelpers,
    gesturesDisabled,
    setGesturesDisabled
  } = props
  const drawerNavigation = useNavigation()

  return (
    <AppDrawerContextProvider
      drawerHelpers={drawerHelpers}
      drawerNavigation={drawerNavigation}
      gesturesDisabled={gesturesDisabled}
      setGesturesDisabled={setGesturesDisabled}
    >
      <NotificationsDrawerScreen />
    </AppDrawerContextProvider>
  )
}
