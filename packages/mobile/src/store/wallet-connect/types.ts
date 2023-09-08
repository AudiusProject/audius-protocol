import type { PayloadAction } from '@reduxjs/toolkit'

export type ConnectionType =
  | 'phantom'
  | 'solana-phone-wallet-adapter'
  | 'wallet-connect'

type ConnectNewPhantomWallet = {
  connectionType: 'phantom'
  path: 'wallet-connect'
  phantom_encryption_public_key: string
  data: string
  nonce: string
}

type ConnectNewEthWallet = {
  connectionType: 'wallet-connect'
  publicKey: string
}

type ConnectSolanaPhoneWallet = {
  connectionType: 'solana-phone-wallet-adapter'
  publicKey: string
}

export type ConnectNewWalletAction = PayloadAction<
  ConnectNewPhantomWallet | ConnectNewEthWallet | ConnectSolanaPhoneWallet
>

type SignPhantomWallet = {
  connectionType: 'phantom'
  path: 'wallet-sign-message'
  data: string
  nonce?: string
  publicKey?: string
}

type SignEthWallet = {
  connectionType: 'wallet-connect'
  data: string
}

type SignSolanaPhoneWallet = {
  connectionType: 'solana-phone-wallet-adapter'
  data: string
  path: string
}

export type SignMessageAction = PayloadAction<
  SignPhantomWallet | SignEthWallet | SignSolanaPhoneWallet
>
