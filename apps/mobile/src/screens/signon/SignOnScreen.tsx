import { useEffect } from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import {
  getAccountReady,
  getEmailField,
  getHandleField
} from 'common/store/pages/signon/selectors'
import type { EditableField } from 'common/store/pages/signon/types'
import { useDispatch, useSelector } from 'react-redux'

import { remindUserToTurnOnNotifications } from 'app/components/notification-reminder/NotificationReminder'
import { track, make } from 'app/services/analytics'
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

  const accountReady = useSelector(getAccountReady)

  const emailField: EditableField = useSelector(getEmailField)
  const handleField: EditableField = useSelector(getHandleField)

  useEffect(() => {
    if (accountReady) {
      track(
        make({
          eventName: EventNames.CREATE_ACCOUNT_FINISH,
          emailAddress: emailField.value,
          handle: handleField.value
        })
      )
      remindUserToTurnOnNotifications(dispatch)
    }
  }, [accountReady, dispatch, emailField.value, handleField.value])

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
