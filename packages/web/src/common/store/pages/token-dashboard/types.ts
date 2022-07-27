import {
  Chain,
  BNWei,
  StringWei,
  WalletAddress,
  Nullable
} from '@audius/common'
import { PayloadAction } from '@reduxjs/toolkit'

type ReceiveState = { stage: 'KEY_DISPLAY' }
type SendingState =
  | { stage: 'INPUT' }
  | {
      stage: 'AWAITING_CONFIRMATION'
      amount: StringWei
      recipientWallet: string
      chain: Chain
    }
  | {
      stage: 'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL'
      amount: StringWei
      recipientWallet: string
      chain: Chain
    }
  | {
      stage: 'SENDING'
      amount: StringWei
      recipientWallet: WalletAddress
      chain: Chain
    }
  | {
      stage: 'CONFIRMED_SEND'
      amount: StringWei
      recipientWallet: WalletAddress
      chain: Chain
    }
  | { stage: 'ERROR'; error: string }

export type ConnectWalletsState =
  | { stage: 'ADD_WALLET' }
  | { stage: 'REMOVE_WALLET' }

export type ModalState = Nullable<
  | { stage: 'CONNECT_WALLETS'; flowState: ConnectWalletsState }
  | { stage: 'RECEIVE'; flowState: ReceiveState }
  | { stage: 'SEND'; flowState: SendingState }
  | { stage: 'DISCORD_CODE' }
>

export type AssociatedWallet = {
  address: string
  balance: BNWei
  collectibleCount: number
}

export type AssociatedWallets = AssociatedWallet[]

export type ConfirmRemoveWalletAction = PayloadAction<{
  wallet: WalletAddress
  chain: Chain
}>

export type AssociatedWalletsState = {
  status: Nullable<'Connecting' | 'Confirming' | 'Confirmed'>
  connectedEthWallets: Nullable<AssociatedWallets>
  connectedSolWallets: Nullable<AssociatedWallets>
  confirmingWallet: {
    wallet: Nullable<WalletAddress>
    chain: Nullable<Chain>
    balance: Nullable<BNWei>
    collectibleCount: Nullable<number>
  }
  errorMessage: Nullable<string>
  removeWallet: {
    wallet: Nullable<string>
    chain: Nullable<Chain>
    status: Nullable<'Confirming'>
  }
}

export type TokenDashboardState = {
  modalState: Nullable<ModalState>
  modalVisible: boolean
  discordCode: Nullable<string>
  associatedWallets: AssociatedWalletsState
}
