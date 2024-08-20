import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAppScreenOptions } from 'app/screens/app-screen/useAppScreenOptions'

import { ChatBlastSelectAudienceScreen } from './ChatBlastSelectAudienceScreen'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const CreateChatBlastNavigator = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name='ChatBlastSelectAudience'
          component={ChatBlastSelectAudienceScreen}
        />
      </Stack.Navigator>
    </>
  )
}
