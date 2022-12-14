import type { RouteProp } from '@react-navigation/native'

export type ConnectNewWalletParams = {
  path: 'wallet-connect'
  phantom_encryption_public_key: string
  data: string
  nonce: string
}
type CancelPhantomConnectParams = {
  path: 'wallet-connect' | 'wallet-sign-message'
  errorCode: string
  errorMessage: string
}

export type SignedMessageParams = {
  path: 'wallet-sign-message'
  data: string
  nonce: string
}

export type WalletConnectParamList = {
  Wallets:
    | ConnectNewWalletParams
    | CancelPhantomConnectParams
    | SignedMessageParams
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
