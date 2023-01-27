import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { Toasts } from 'app/components/toasts'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { WalletConnectScreen } from './WalletConnectScreen'
import { ConfirmRemoveWalletDrawer, WalletsDrawer } from './components'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const WalletConnectStack = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <>
      <Toasts />
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='Wallets' component={WalletConnectScreen} />
      </Stack.Navigator>
      <WalletsDrawer />
      <ConfirmRemoveWalletDrawer />
    </>
  )
}
