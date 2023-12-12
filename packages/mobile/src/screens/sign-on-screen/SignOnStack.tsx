import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useScreenOptions } from 'app/app/navigation'

import { CreatePasswordScreen } from './screens/CreatePasswordScreen'
import { FinishProfileScreen } from './screens/FinishProfileScreen'
import { PickHandleScreen } from './screens/PickHandleScreen'
import { SelectArtistsScreen } from './screens/SelectArtistsScreen'
import { SelectGenreScreen } from './screens/SelectGenreScreen'
import { SignOnScreen } from './screens/SignOnScreen'

const Stack = createNativeStackNavigator()
const screenOptionsOverrides = { animationTypeForReplace: 'pop' as const }

export const SignOnStack = () => {
  const screenOptions = useScreenOptions(screenOptionsOverrides)
  return (
    <Stack.Navigator
      initialRouteName='FinishProfile'
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name='SignOn'
        component={SignOnScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name='CreatePassword' component={CreatePasswordScreen} />
      <Stack.Screen name='PickHandle' component={PickHandleScreen} />
      <Stack.Screen name='FinishProfile' component={FinishProfileScreen} />
      <Stack.Screen name='SelectGenre' component={SelectGenreScreen} />
      <Stack.Screen name='SelectArtists' component={SelectArtistsScreen} />
    </Stack.Navigator>
  )
}
