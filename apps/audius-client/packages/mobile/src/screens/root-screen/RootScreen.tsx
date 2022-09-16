import { useEffect, useState } from 'react'

import { accountSelectors } from '@audius/common'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { createDrawerNavigator } from '@react-navigation/drawer'
// eslint-disable-next-line import/no-unresolved
import type { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { setupBackend } from 'audius-client/src/common/store/backend/actions'
import { Dimensions } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import useAppState from 'app/hooks/useAppState'
import { useUpdateRequired } from 'app/hooks/useUpdateRequired'
import PushNotifications from 'app/notifications'
import type { AppScreenParamList } from 'app/screens/app-screen'
import { AppScreen } from 'app/screens/app-screen'
import {
  NotificationsScreen,
  NotificationsDrawerNavigationContextProvider
} from 'app/screens/notifications-screen'
import { SignOnScreen } from 'app/screens/signon'
import { UpdateRequiredScreen } from 'app/screens/update-required-screen/UpdateRequiredScreen'
import { enterBackground, enterForeground } from 'app/store/lifecycle/actions'

import { SplashScreen } from '../splash-screen'

const { getHasAccount } = accountSelectors

export type RootScreenParamList = {
  signOn: undefined
  App: NavigatorScreenParams<{
    MainStack: NavigatorScreenParams<AppScreenParamList>
  }>
}

const SCREEN_WIDTH = Dimensions.get('window').width

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()

/**
 * The sign up & sign in stack when not authenticated
 */
const SignOnStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ gestureEnabled: false, headerShown: false }}
    >
      <Stack.Screen name='SignOnStack' component={SignOnScreen} />
    </Stack.Navigator>
  )
}

/**
 * Update stack when the app is behind the minimum app version
 */
const UpdateStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ gestureEnabled: false, headerShown: false }}
    >
      <Stack.Screen name='UpdateStack' component={UpdateRequiredScreen} />
    </Stack.Navigator>
  )
}

type MainStackProps = {
  navigation: DrawerNavigationHelpers
}

/**
 * The main stack after signing up or signing in
 */
const MainStack = (props: MainStackProps) => {
  const { navigation: drawerHelpers } = props
  const drawerNavigation = useNavigation()
  return (
    <NotificationsDrawerNavigationContextProvider
      drawerNavigation={drawerNavigation}
      drawerHelpers={drawerHelpers}
    >
      <Stack.Navigator
        screenOptions={{ gestureEnabled: false, headerShown: false }}
      >
        <Stack.Screen name='MainStack' component={AppScreen} />
      </Stack.Navigator>
    </NotificationsDrawerNavigationContextProvider>
  )
}

type NotificationDrawerContentsProps = DrawerContentComponentProps & {
  disableGestures: boolean
  setDisableGestures: (disabled: boolean) => void
}

/**
 * The contents of the notifications drawer, which swipes in
 */
const NotificationsDrawerContents = (
  props: NotificationDrawerContentsProps
) => {
  const {
    navigation: drawerHelpers,
    disableGestures,
    setDisableGestures,
    state
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
      state={state}
    >
      <NotificationsScreen />
    </NotificationsDrawerNavigationContextProvider>
  )
}

type RootScreenProps = {
  isReadyToSetupBackend: boolean
}

/**
 * The top level navigator. Switches between sign on screens and main tab navigator
 * based on if the user is authed
 */
export const RootScreen = ({ isReadyToSetupBackend }: RootScreenProps) => {
  const dispatch = useDispatch()
  const hasAccount = useSelector(getHasAccount)
  const [disableGestures, setDisableGestures] = useState(false)
  const { updateRequired } = useUpdateRequired()

  useEffect(() => {
    // Setup the backend when ready
    if (isReadyToSetupBackend) {
      dispatch(setupBackend())
    }
  }, [dispatch, isReadyToSetupBackend])

  useAppState(
    () => dispatch(enterForeground()),
    () => dispatch(enterBackground())
  )

  return (
    <>
      <SplashScreen />
      {updateRequired ? <UpdateStack /> : null}
      {!hasAccount ? (
        <SignOnStack />
      ) : (
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
            <NotificationsDrawerContents
              disableGestures={disableGestures}
              setDisableGestures={setDisableGestures}
              {...props}
            />
          )}
        >
          <Drawer.Screen name='App' component={MainStack} />
        </Drawer.Navigator>
      )}
    </>
  )
}
