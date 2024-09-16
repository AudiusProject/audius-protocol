import type { RouteProp } from '@react-navigation/native'

export type ConnectParams = {
  path: 'connect'
  phantom_encryption_public_key: string
  data: string
  nonce: string
  params?: ConnectParams
}

export type ConnectNewWalletParams = {
  path: 'wallet-connect'
  phantom_encryption_public_key: string
  data: string
  nonce: string
  params?: ConnectNewWalletParams
}
type CancelPhantomConnectParams = {
  path: 'wallet-connect' | 'wallet-sign-message'
  errorCode: string
  errorMessage: string
  params?: CancelPhantomConnectParams
}

export type SignedMessageParams = {
  path: 'wallet-sign-message'
  data: string
  nonce: string
  params?: SignedMessageParams
}

export type WalletConnectParamList = {
  Wallets:
    | ConnectParams
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
  | ConnectParams
  | ConnectNewWalletParams
  | SignedMessageParams

export type WalletConnectRoute<Screen extends keyof WalletConnectParamList> =
  RouteProp<WalletConnectParamList, Screen>
