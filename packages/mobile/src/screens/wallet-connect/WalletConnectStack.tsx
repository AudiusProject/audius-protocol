import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ConfirmWalletConnectionScreen } from './ConfirmWalletConnectionScreen'
import { WalletConnectScreen } from './WalletConnectScreen'

const Stack = createNativeStackNavigator()

export const WalletConnectStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ presentation: 'modal', headerShown: false }}
    >
      <Stack.Screen name='Wallets' component={WalletConnectScreen} />
      <Stack.Screen
        name='ConfirmWalletConnection'
        component={ConfirmWalletConnectionScreen}
      />
    </Stack.Navigator>
  )
}
