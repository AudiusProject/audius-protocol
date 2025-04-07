import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ModalScreen } from 'app/components/core'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { ExternalWalletsScreen } from './ExternalWalletsScreen'
import { ConfirmRemoveWalletDrawer, ConnectNewWalletDrawer } from './components'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const ExternalWalletsModalScreen = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <ModalScreen>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='Wallets' component={ExternalWalletsScreen} />
      </Stack.Navigator>
      <ConnectNewWalletDrawer />
      <ConfirmRemoveWalletDrawer />
    </ModalScreen>
  )
}
