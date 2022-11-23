import type { RouteProp } from '@react-navigation/native'

export type WalletConnectParamList = {
  Wallets: undefined
  ConfirmWalletConnection: {
    phantom_encryption_public_key: string
    data: string
    nonce: string
  }
}

export type WalletConnectRoute<Screen extends keyof WalletConnectParamList> =
  RouteProp<WalletConnectParamList, Screen>
