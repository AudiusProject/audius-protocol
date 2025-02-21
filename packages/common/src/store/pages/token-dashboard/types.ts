import { PayloadAction } from '@reduxjs/toolkit'

import { Chain } from '../../../models/Chain'
import { StringWei, WalletAddress } from '../../../models/Wallet'
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

export type TokenDashboardPageModalState = Nullable<
  | { stage: 'RECEIVE'; flowState: ReceiveState }
  | { stage: 'SEND'; flowState: SendingState }
  | { stage: 'DISCORD_CODE' }
>

export type CanReceiveWAudio = 'false' | 'loading' | 'true'

export type ConfirmRemoveWalletAction = PayloadAction<{
  wallet: WalletAddress
  chain: Chain
}>

export type InputSendDataAction = PayloadAction<{
  amount: StringWei
  wallet: WalletAddress
}>

export type TokenDashboardState = {
  modalState: Nullable<TokenDashboardPageModalState>
  modalVisible: boolean
  discordCode: Nullable<string>
}
