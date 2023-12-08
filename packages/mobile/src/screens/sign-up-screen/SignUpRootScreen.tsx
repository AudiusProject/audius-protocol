import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { CreateEmailScreen } from './screens/CreateEmailScreen'
import { CreatePasswordScreen } from './screens/CreatePasswordScreen'
import { FinishProfileScreen } from './screens/FinishProfileScreen'
import { PickHandleScreen } from './screens/PickHandleScreen'
import { SelectArtistsScreen } from './screens/SelectArtistsScreen'
import { SelectGenreScreen } from './screens/SelectGenreScreen'

const Stack = createNativeStackNavigator()
const screenOptions = { animationTypeForReplace: 'pop' as const }

export const SignUpRootScreen = () => {
  return (
    <Stack.Navigator
      initialRouteName='CreateEmail'
      screenOptions={screenOptions}
    >
      <Stack.Screen name='CreateEmail' component={CreateEmailScreen} />
      <Stack.Screen name='CreatePassword' component={CreatePasswordScreen} />
      <Stack.Screen name='PickHandle' component={PickHandleScreen} />
      <Stack.Screen name='FinishProfile' component={FinishProfileScreen} />
      <Stack.Screen name='SelectGenre' component={SelectGenreScreen} />
      <Stack.Screen name='SelectArtists' component={SelectArtistsScreen} />
    </Stack.Navigator>
  )
}
