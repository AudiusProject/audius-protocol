import { createNativeStackNavigator } from '@react-navigation/native-stack'

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
  return (
    <Stack.Navigator
      initialRouteName='SignOn'
      screenOptions={{ animationTypeForReplace: 'pop' }}
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
