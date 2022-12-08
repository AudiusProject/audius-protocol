import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { NativeDrawer } from 'app/Drawers'
import { ToastContextProvider } from 'app/components/toast/ToastContext'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { WalletConnectScreen } from './WalletConnectScreen'
import { WalletsDrawer } from './components'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const WalletConnectStack = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <ToastContextProvider>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='Wallets' component={WalletConnectScreen} />
      </Stack.Navigator>
      <NativeDrawer drawerName='ConnectWallets' drawer={WalletsDrawer} />
    </ToastContextProvider>
  )
}
