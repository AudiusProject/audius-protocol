import { PayloadAction } from '@reduxjs/toolkit'

import { Status } from '~/models'

import { Chain } from '../../../models/Chain'
import { BNWei, StringWei, WalletAddress } from '../../../models/Wallet'
import { Nullable } from '../../../utils/typeUtils'
// TODO(nkang) Figure out how to import BNWei from here without invalidating slice.ts
// import { BNWei } from '../../../models/Wallet'

type ReceiveState = { stage: 'KEY_DISPLAY' }
type SendingState =
  | { stage: 'INPUT' }
  | {
      stage: 'AWAITING_CONFIRMATION'
      amount: StringWei
      recipientWallet: string
      canRecipientReceiveWAudio: CanReceiveWAudio
    }
  | {
      stage: 'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL'
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

export type TokenDashboardPageModalState = Nullable<
  | { stage: 'CONNECT_WALLETS'; flowState: ConnectWalletsState }
  | { stage: 'RECEIVE'; flowState: ReceiveState }
  | { stage: 'SEND'; flowState: SendingState }
  | { stage: 'DISCORD_CODE' }
>

export type CanReceiveWAudio = 'false' | 'loading' | 'true'

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

export type InputSendDataAction = PayloadAction<{
  amount: StringWei
  wallet: WalletAddress
}>

export type AssociatedWalletsState = {
  loadingStatus: Status
  status: Nullable<'Connecting' | 'Connected' | 'Confirming' | 'Confirmed'>
  connectedEthWallets: Nullable<AssociatedWallets>
  connectedSolWallets: Nullable<AssociatedWallets>
  confirmingWallet: {
    wallet: Nullable<WalletAddress>
    chain: Nullable<Chain>
    balance: Nullable<any> // TODO(nkang) `any` should be `BNWei`
    collectibleCount: Nullable<number>
    signature: Nullable<string>
  }
  errorMessage: Nullable<string>
  removeWallet: {
    wallet: Nullable<string>
    chain: Nullable<Chain>
    status: Nullable<'Confirming' | 'Confirmed'>
  }
}

export type TokenDashboardState = {
  modalState: Nullable<TokenDashboardPageModalState>
  modalVisible: boolean
  discordCode: Nullable<string>
  associatedWallets: AssociatedWalletsState
}
