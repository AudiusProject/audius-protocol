import { useEffect } from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useDispatch, useSelector } from 'react-redux'

import { remindUserToTurnOnNotifications } from 'app/components/notification-reminder/NotificationReminder'
import { track, make } from 'app/services/analytics'
import { getOnSignUp } from 'app/store/lifecycle/selectors'
import {
  getAccountAvailable,
  getFinalEmail,
  getFinalHandle
} from 'app/store/signon/selectors'
import { EventNames } from 'app/types/analytics'

import CreatePassword from './CreatePassword'
import FirstFollows from './FirstFollows'
import ProfileAuto from './ProfileAuto'
import ProfileManual from './ProfileManual'
import SignOn from './SignOn'
import SignupLoadingPage from './SignupLoadingPage'

const Stack = createNativeStackNavigator()

const signOnScreens = [
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

const screenOptions = {
  headerShown: false,
  gestureEnabled: false,
  animation: 'slide_from_right' as const
}

export const SignOnScreen = () => {
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

  return (
    <Stack.Navigator
      initialRouteName='SignOn'
      screenOptions={{ animationTypeForReplace: 'push' }}
    >
      {signOnScreens.map(({ name, component }) => (
        <Stack.Screen
          key={name}
          name={name}
          component={component}
          options={screenOptions}
        />
      ))}
    </Stack.Navigator>
  )
}
