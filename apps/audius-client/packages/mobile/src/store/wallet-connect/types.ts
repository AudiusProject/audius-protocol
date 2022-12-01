import type { PayloadAction } from '@reduxjs/toolkit'

export type ConnectNewWalletAction = PayloadAction<{
  path: 'wallet-connect'
  phantom_encryption_public_key: string
  data: string
  nonce: string
}>

export type SignMessageAction = PayloadAction<{
  path: 'wallet-sign-message'
  data: string
  nonce: string
}>
