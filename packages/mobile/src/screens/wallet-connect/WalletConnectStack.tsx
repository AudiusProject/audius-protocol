import AsyncStorage from '@react-native-async-storage/async-storage'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import WalletConnectProvider from '@walletconnect/react-native-dapp'

import { NativeDrawer } from 'app/Drawers'
import { ToastContextProvider } from 'app/components/toast/ToastContext'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { ConfirmWalletConnectionScreen } from './ConfirmWalletConnectionScreen'
import { WalletConnectScreen } from './WalletConnectScreen'
import { WalletConnectProviderRenderModal, WalletsDrawer } from './components'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const WalletConnectStack = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <ToastContextProvider>
      <WalletConnectProvider
        redirectUrl='audius://'
        storageOptions={{
          // @ts-ignore: IAsyncStorage isn't up to date
          asyncStorage: AsyncStorage
        }}
        renderQrcodeModal={WalletConnectProviderRenderModal}
      >
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name='Wallets' component={WalletConnectScreen} />
          <Stack.Screen
            name='ConfirmWalletConnection'
            component={ConfirmWalletConnectionScreen}
          />
        </Stack.Navigator>
        <NativeDrawer drawerName='ConnectWallets' drawer={WalletsDrawer} />
      </WalletConnectProvider>
    </ToastContextProvider>
  )
}
