import { useRoute } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ModalScreen } from 'app/components/core'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { BuySellScreen } from './BuySellScreen'
import { ConfirmSwapScreen } from './ConfirmSwapScreen'
import { TransactionResultScreen } from './TransactionResultScreen'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const BuySellModalScreen = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)
  const { params } = useRoute()

  return (
    <ModalScreen>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name='BuySellForm'
          component={BuySellScreen}
          initialParams={params}
        />
        <Stack.Screen
          name='ConfirmSwapScreen'
          component={ConfirmSwapScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name='TransactionResultScreen'
          component={TransactionResultScreen}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </ModalScreen>
  )
}
