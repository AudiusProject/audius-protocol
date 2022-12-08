import AsyncStorage from '@react-native-async-storage/async-storage'
import WalletConnectProviderBase from '@walletconnect/react-native-dapp'

import { WalletConnectProviderRenderModal } from './components'

type WalletConnectProviderProps = {
  children: JSX.Element | readonly JSX.Element[]
}

export const WalletConnectProvider = (props: WalletConnectProviderProps) => {
  const { children } = props
  return (
    <WalletConnectProviderBase
      redirectUrl='audius://wallets'
      storageOptions={{
        // @ts-ignore: IAsyncStorage isn't up to date
        asyncStorage: AsyncStorage
      }}
      renderQrcodeModal={(props) => {
        return <WalletConnectProviderRenderModal {...props} />
      }}
    >
      {children}
    </WalletConnectProviderBase>
  )
}
