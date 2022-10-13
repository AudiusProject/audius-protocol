import { useEffect } from 'react'

import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useNavigation } from '@react-navigation/native'

import PushNotifications from 'app/notifications'

import { AppDrawerContextProvider } from '../app-drawer-screen'

import { NotificationsDrawerScreen } from './NotificationsDrawerScreen'

type NotificationDrawerContentsProps = DrawerContentComponentProps & {
  disableGestures: boolean
  setDisableGestures: (disabled: boolean) => void
}

/**
 * The content of the notifications drawer, which swipes in
 */
export const NotificationsDrawer = (props: NotificationDrawerContentsProps) => {
  const {
    navigation: drawerHelpers,
    disableGestures,
    setDisableGestures
  } = props
  const drawerNavigation = useNavigation()

  useEffect(() => {
    PushNotifications.setDrawerHelpers(drawerHelpers)
  }, [drawerHelpers])

  return (
    <AppDrawerContextProvider
      drawerHelpers={drawerHelpers}
      drawerNavigation={drawerNavigation}
      gesturesDisabled={disableGestures}
      setGesturesDisabled={setDisableGestures}
    >
      <NotificationsDrawerScreen />
    </AppDrawerContextProvider>
  )
}
