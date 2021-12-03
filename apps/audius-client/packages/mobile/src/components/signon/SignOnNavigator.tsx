import React, { useEffect } from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { remindUserToTurnOnNotifications } from 'app/components/notification-reminder/NotificationReminder'
import { getOnSignUp } from 'app/store/lifecycle/selectors'
import {
  getAccountAvailable,
  getFinalEmail,
  getFinalHandle
} from 'app/store/signon/selectors'
import { EventNames } from 'app/types/analytics'
import { track, make } from 'app/utils/analytics'

import CreatePassword from './CreatePassword'
import FirstFollows from './FirstFollows'
import ProfileAuto from './ProfileAuto'
import ProfileManual from './ProfileManual'
import SignOn from './SignOn'
import SignupLoadingPage from './SignupLoadingPage'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    elevation: 1,
    zIndex: 2,
    backgroundColor: 'white'
  }
})

const Stack = createNativeStackNavigator()

const SignOnNavigator = () => {
  const dispatch = useDispatch()

  const onSignUp = useSelector(getOnSignUp)
  const isAccountAvailable = useSelector(getAccountAvailable)
  const finalEmail = useSelector(getFinalEmail)
  const finalHandle = useSelector(getFinalHandle)

  useEffect(() => {
    if (onSignUp && isAccountAvailable) {
      track(
        make({
          eventName: EventNames.CREATE_ACCOUNT_FINISH,
          emailAddress: finalEmail,
          handle: finalHandle
        })
      )
      remindUserToTurnOnNotifications(dispatch)
    }
  }, [onSignUp, isAccountAvailable, finalEmail, finalHandle, dispatch])

  const screenProps = [
    {
      name: 'SignOn',
      component: SignOn
    },
    {
      name: 'CreatePassword',
      component: CreatePassword
    },
    {
      name: 'ProfileAuto',
      component: ProfileAuto
    },
    {
      name: 'ProfileManual',
      component: ProfileManual
    },
    {
      name: 'FirstFollows',
      component: FirstFollows
    },
    {
      name: 'SignupLoadingPage',
      component: SignupLoadingPage
    }
  ]

  return (
    <View style={styles.container}>
      <Stack.Navigator
        initialRouteName='SignOn'
        screenOptions={{
          animationTypeForReplace: 'push'
        }}
      >
        {screenProps.map(props => (
          <Stack.Screen
            key={props.name}
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: 'slide_from_right'
            }}
            {...props}
          />
        ))}
      </Stack.Navigator>
    </View>
  )
}

export default SignOnNavigator
