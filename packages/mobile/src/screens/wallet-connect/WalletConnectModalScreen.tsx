import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ModalScreen } from 'app/components/core'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { WalletConnectScreen } from './WalletConnectScreen'
import { ConfirmRemoveWalletDrawer, WalletsDrawer } from './components'
import { usePhantomConnect } from './usePhantomConnect'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const WalletConnectModalScreen = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)
  usePhantomConnect()

  return (
    <ModalScreen>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='Wallets' component={WalletConnectScreen} />
      </Stack.Navigator>
      <WalletsDrawer />
      <ConfirmRemoveWalletDrawer />
    </ModalScreen>
  )
}
