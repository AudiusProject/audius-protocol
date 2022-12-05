import type { PayloadAction } from '@reduxjs/toolkit'
import type WalletConnect from '@walletconnect/client'

export type ConnectionType =
  | 'phantom'
  | 'solana-phone-wallet-adapter'
  | 'wallet-connect'

export type ConnectNewWalletAction = PayloadAction<{
  path: 'wallet-connect'
  phantom_encryption_public_key: string
  data: string
  nonce: string
  connector?: WalletConnect
}>

export type SignMessageAction = PayloadAction<{
  path: 'wallet-sign-message'
  data: string
  nonce?: string
  publicKey?: string
}>
