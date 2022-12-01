import type { RouteProp } from '@react-navigation/native'

export type ConnectNewWalletParams = {
  path: 'wallet-connect'
  phantom_encryption_public_key: string
  data: string
  nonce: string
}

export type SignedMessageParams = {
  path: 'wallet-sign-message'
  data: string
  nonce: string
}

export type WalletConnectParamList = {
  Wallets: undefined | ConnectNewWalletParams | SignedMessageParams
  ConfirmWalletConnection: {
    phantom_encryption_public_key: string
    data: string
    nonce: string
  }
}

export type WalletConnectParams =
  | undefined
  | ConnectNewWalletParams
  | SignedMessageParams

export type WalletConnectRoute<Screen extends keyof WalletConnectParamList> =
  RouteProp<WalletConnectParamList, Screen>
