import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { CreatePasswordScreen } from './screens/CreatePasswordScreen'
import { FinishProfileScreen } from './screens/FinishProfileScreen'
import { PickHandleScreen } from './screens/PickHandleScreen'
import { SelectArtistsScreen } from './screens/SelectArtistsScreen'
import { SelectGenreScreen } from './screens/SelectGenreScreen'
import { SignUpScreen } from './screens/SignUpScreen'

const Stack = createNativeStackNavigator()
const screenOptions = { animationTypeForReplace: 'pop' as const }

export const SignUpRootScreen = () => {
  return (
    <Stack.Navigator initialRouteName='SignUp' screenOptions={screenOptions}>
      <Stack.Screen name='SignUp' component={SignUpScreen} />
      <Stack.Screen name='CreatePassword' component={CreatePasswordScreen} />
      <Stack.Screen name='PickHandle' component={PickHandleScreen} />
      <Stack.Screen name='FinishProfile' component={FinishProfileScreen} />
      <Stack.Screen name='SelectGenre' component={SelectGenreScreen} />
      <Stack.Screen name='SelectArtists' component={SelectArtistsScreen} />
    </Stack.Navigator>
  )
}
