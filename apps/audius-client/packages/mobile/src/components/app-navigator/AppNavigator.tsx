import React, { useCallback, useMemo, useState } from 'react'

import { useNavigationState } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

import SignOnNavigator from 'app/components/signon/SignOnNavigator'
import {
  getDappLoaded,
  getIsSignedIn,
  getOnSignUp
} from 'app/store/lifecycle/selectors'
import { getAccountAvailable } from 'app/store/signon/selectors'
import { getNavigationStateAtRoute } from 'app/utils/navigation'

import BottomTabNavigator from './BottomTabNavigator'

// This enables the RN bottom bar and navigation
const IS_MAIN_NAVIGATION_ENABLED = false

// As screens get migrated to RN, add them to this set.
// This set should only include the screens accessible from the bottom bar
// (sign on screens are implicitly included)
const nativeScreens = new Set([])

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
  const [bottomTabBarHeight, setBottomTabBarHeight] = useState(0)
  const mainNavigationState = useNavigationState(
    getNavigationStateAtRoute(['main'])
  )

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

  const isNativeScreen = useMemo(() => {
    return (
      !mainNavigationState ||
      nativeScreens.has(
        mainNavigationState.routes[mainNavigationState.index]?.name
      )
    )
  }, [mainNavigationState])

  const navigatorHeight = useMemo(() => {
    if (!IS_MAIN_NAVIGATION_ENABLED && isAuthed) {
      return 0
    }

    return isNativeScreen ? '100%' : bottomTabBarHeight
  }, [isAuthed, isNativeScreen, bottomTabBarHeight])

  // Set the height of the navigator to be the height of the bottom tab bar
  // in cases where the webview needs to be shown.
  // Janky but required to get touch events etc. working properly
  // Can be removed when fully migrated to RN
  const handleBottomTabBarLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout
    setBottomTabBarHeight(height)
  }, [])

  return (
    <View style={[styles.appNavigator, { height: navigatorHeight }]}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false
        }}
      >
        {isAuthed ? (
          <Stack.Screen name='main' navigationKey='main'>
            {() => (
              <BottomTabNavigator
                onBottomTabBarLayout={handleBottomTabBarLayout}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name='sign-on' component={SignOnNavigator} />
        )}
      </Stack.Navigator>
    </View>
  )
}

export default AppNavigator
