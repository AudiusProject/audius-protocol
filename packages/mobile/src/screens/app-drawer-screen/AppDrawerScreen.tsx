import { useMemo, useState } from 'react'

import { FeatureFlags } from '@audius/common'
import { createDrawerNavigator } from '@react-navigation/drawer'
// eslint-disable-next-line import/no-unresolved
import type { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import { useNavigation } from '@react-navigation/native'
import { Dimensions } from 'react-native'

import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { NotificationsDrawer } from 'app/screens/notifications-screen'

import { AccountDrawer } from '../account-screen'
import { AppScreen } from '../app-screen'

import { AppDrawerContextProvider } from './AppDrawerContext'

const SCREEN_WIDTH = Dimensions.get('window').width

const baseDrawerScreenOptions = {
  drawerType: 'slide' as const,
  headerShown: false,
  swipeEdgeWidth: SCREEN_WIDTH
}

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
    <AppDrawerContextProvider
      drawerNavigation={drawerNavigation}
      drawerHelpers={drawerHelpers}
    >
      <AppScreen />
    </AppDrawerContextProvider>
  )
}

export const AppDrawerScreen = () => {
  const [disableGestures, setDisableGestures] = useState(false)
  const { isEnabled } = useFeatureFlag(FeatureFlags.MOBILE_NAV_OVERHAUL)
  const DrawerComponent = isEnabled ? AccountDrawer : NotificationsDrawer

  const drawerScreenOptions = useMemo(
    () => ({
      ...baseDrawerScreenOptions,
      drawerStyle: {
        width: isEnabled ? '75%' : '100%'
      },
      gestureHandlerProps: {
        enabled: !disableGestures
      }
    }),
    [isEnabled, disableGestures]
  )

  return (
    <Drawer.Navigator
      // legacy implementation uses reanimated-v1
      useLegacyImplementation={true}
      screenOptions={drawerScreenOptions}
      drawerContent={(props) => (
        <DrawerComponent
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
