import { PayloadAction } from '@reduxjs/toolkit'

import { Chain } from 'common/models/Chain'
import { BNWei, StringWei, WalletAddress } from 'common/models/Wallet'
import { Nullable } from 'common/utils/typeUtils'

type ReceiveState = { stage: 'KEY_DISPLAY' }
type SendingState =
  | { stage: 'INPUT' }
  | {
      stage: 'AWAITING_CONFIRMATION'
      amount: StringWei
      recipientWallet: string
    }
  | {
      stage: 'SENDING'
      amount: StringWei
      recipientWallet: WalletAddress
    }
  | {
      stage: 'CONFIRMED_SEND'
      amount: StringWei
      recipientWallet: WalletAddress
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

export type AssociatedWallets = {
  address: string
  balance: BNWei
  collectibleCount: number
}[]

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
