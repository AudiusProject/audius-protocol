import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useScreenOptions } from 'app/app/navigation'

import { AccountLoadingScreen } from './screens/AccountLoadingScreen'
import { CreateLoginDetailsScreen } from './screens/CreateLoginDetailsScreen'
import { CreatePasswordScreen } from './screens/CreatePasswordScreen'
import { FinishProfileScreen } from './screens/FinishProfileScreen'
import { PickHandleScreen } from './screens/PickHandleScreen'
import { ReviewHandleScreen } from './screens/ReviewHandleScreen'
import { SelectArtistsScreen } from './screens/SelectArtistScreen'
import { SelectGenresScreen } from './screens/SelectGenresScreen'
import { SignOnScreen } from './screens/SignOnScreen'

const Stack = createNativeStackNavigator()
const screenOptionsOverrides = { animationTypeForReplace: 'pop' as const }

export const SignOnStack = () => {
  const screenOptions = useScreenOptions(screenOptionsOverrides)
  return (
    <Stack.Navigator initialRouteName='SignOn' screenOptions={screenOptions}>
      <Stack.Screen
        name='SignOn'
        component={SignOnScreen}
        options={{ headerShown: false }}
        initialParams={{ screen: 'sign-up' }}
      />
      <Stack.Screen name='CreatePassword' component={CreatePasswordScreen} />
      <Stack.Screen name='PickHandle' component={PickHandleScreen} />
      <Stack.Screen name='ReviewHandle' component={ReviewHandleScreen} />
      <Stack.Screen
        name='CreateLoginDetails'
        component={CreateLoginDetailsScreen}
      />
      <Stack.Screen name='FinishProfile' component={FinishProfileScreen} />
      <Stack.Screen name='SelectGenre' component={SelectGenresScreen} />
      <Stack.Screen name='SelectArtists' component={SelectArtistsScreen} />
      <Stack.Screen
        name='AccountLoading'
        component={AccountLoadingScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}
