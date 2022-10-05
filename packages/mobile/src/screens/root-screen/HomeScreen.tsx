import { useEffect, useState } from 'react'

import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { createDrawerNavigator } from '@react-navigation/drawer'
// eslint-disable-next-line import/no-unresolved
import type { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import { useNavigation } from '@react-navigation/native'
import { Dimensions } from 'react-native'

import PushNotifications from 'app/notifications'
import {
  NotificationsScreen,
  NotificationsDrawerNavigationContextProvider
} from 'app/screens/notifications-screen'

import { AppScreen } from '../app-screen'

const SCREEN_WIDTH = Dimensions.get('window').width

const Drawer = createDrawerNavigator()

type AppTabScreenProps = {
  navigation: DrawerNavigationHelpers
}

/**
 * The app stack after signing up or signing in
 */
const AppStack = (props: AppTabScreenProps) => {
  const { navigation: drawerHelpers } = props
  const drawerNavigation = useNavigation()
  return (
    <NotificationsDrawerNavigationContextProvider
      drawerNavigation={drawerNavigation}
      drawerHelpers={drawerHelpers}
    >
      <AppScreen />
    </NotificationsDrawerNavigationContextProvider>
  )
}

type NotificationDrawerContentsProps = DrawerContentComponentProps & {
  disableGestures: boolean
  setDisableGestures: (disabled: boolean) => void
}

/**
 * The content of the notifications drawer, which swipes in
 */
const NotificationDrawer = (props: NotificationDrawerContentsProps) => {
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
    <NotificationsDrawerNavigationContextProvider
      drawerHelpers={drawerHelpers}
      drawerNavigation={drawerNavigation}
      gesturesDisabled={disableGestures}
      setGesturesDisabled={setDisableGestures}
    >
      <NotificationsScreen />
    </NotificationsDrawerNavigationContextProvider>
  )
}

export const HomeScreen = () => {
  const [disableGestures, setDisableGestures] = useState(false)

  return (
    <Drawer.Navigator
      // legacy implementation uses reanimated-v1
      useLegacyImplementation={true}
      detachInactiveScreens={false}
      screenOptions={{
        drawerType: 'slide',
        headerShown: false,
        drawerStyle: {
          width: '100%'
        },
        swipeEdgeWidth: SCREEN_WIDTH,
        gestureHandlerProps: {
          enabled: !disableGestures
        }
      }}
      drawerContent={(props) => (
        <NotificationDrawer
          disableGestures={disableGestures}
          setDisableGestures={setDisableGestures}
          {...props}
        />
      )}
    >
      <Drawer.Screen name='App' component={AppStack} />
    </Drawer.Navigator>
  )
}
