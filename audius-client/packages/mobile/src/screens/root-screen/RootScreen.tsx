import { NavigatorScreenParams } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useSelector } from 'react-redux'

import { AppScreen, AppScreenParamList } from 'app/screens/app-screen'
import { SignOnScreen } from 'app/screens/signon'
import {
  getDappLoaded,
  getIsSignedIn,
  getOnSignUp
} from 'app/store/lifecycle/selectors'
import { getAccountAvailable } from 'app/store/signon/selectors'

export type RootScreenParamList = {
  signOn: undefined
  App: NavigatorScreenParams<AppScreenParamList>
}

const Stack = createStackNavigator()

/**
 * The top level navigator. Switches between sign on screens and main tab navigator
 * based on if the user is authed
 */
export const RootScreen = () => {
  const dappLoaded = useSelector(getDappLoaded)
  const signedIn = useSelector(getIsSignedIn)
  const onSignUp = useSelector(getOnSignUp)
  const isAccountAvailable = useSelector(getAccountAvailable)

  const isAuthed =
    !dappLoaded ||
    signedIn === null ||
    (signedIn && !onSignUp) ||
    isAccountAvailable

  return (
    <Stack.Navigator
      screenOptions={{ gestureEnabled: false, headerShown: false }}
    >
      {isAuthed ? (
        <Stack.Screen name='App' component={AppScreen} />
      ) : (
        <Stack.Screen name='SignOnStack' component={SignOnScreen} />
      )}
    </Stack.Navigator>
  )
}
