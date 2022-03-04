import { useMemo } from 'react'

import { createStackNavigator } from '@react-navigation/stack'
import { StyleSheet, View } from 'react-native'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'

import SignOnNavigator from 'app/components/signon/SignOnNavigator'
import {
  getDappLoaded,
  getIsSignedIn,
  getOnSignUp
} from 'app/store/lifecycle/selectors'
import { getAccountAvailable } from 'app/store/signon/selectors'

import { BottomTabNavigator } from './BottomTabNavigator'

// This enables the RN bottom bar and navigation
const IS_MAIN_NAVIGATION_ENABLED = Config.NATIVE_NAVIGATION_ENABLED === 'true'

const styles = StyleSheet.create({
  appNavigator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100%'
  }
})

const Stack = createStackNavigator()

/**
 * The top level navigator. Switches between sign on screens and main tab navigator
 * based on if the user is authed
 */
const AppNavigator = () => {
  const dappLoaded = useSelector(getDappLoaded)
  const signedIn = useSelector(getIsSignedIn)
  const onSignUp = useSelector(getOnSignUp)
  const isAccountAvailable = useSelector(getAccountAvailable)

  const isAuthed = useMemo(() => {
    return (
      !dappLoaded ||
      signedIn === null ||
      (signedIn && !onSignUp) ||
      isAccountAvailable
    )
  }, [dappLoaded, isAccountAvailable, signedIn, onSignUp])

  // Set the height of the navigator to be 0
  // in cases where the webview needs to be shown.
  // Janky but required to get touch events etc. working properly
  // Can be removed when fully migrated to RN
  const navigatorHeight = useMemo(() => {
    if (!IS_MAIN_NAVIGATION_ENABLED && isAuthed) {
      return 0
    }

    return '100%'
  }, [isAuthed])

  return (
    <View style={[styles.appNavigator, { height: navigatorHeight }]}>
      <Stack.Navigator
        screenOptions={{
          gestureEnabled: false,
          headerShown: false
        }}
      >
        {isAuthed ? (
          <Stack.Screen
            name='main'
            navigationKey='main'
            component={IS_MAIN_NAVIGATION_ENABLED ? BottomTabNavigator : View}
          />
        ) : (
          <Stack.Screen name='sign-on' component={SignOnNavigator} />
        )}
      </Stack.Navigator>
    </View>
  )
}

export default AppNavigator
