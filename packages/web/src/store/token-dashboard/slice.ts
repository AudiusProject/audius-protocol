import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppState } from 'store/types'
import {
  BNWei,
  StringWei,
  stringWeiToBN,
  WalletAddress
} from 'store/wallet/slice'
import { Nullable } from 'utils/typeUtils'

export type ClaimState =
  | { stage: 'CLAIMING' }
  | { stage: 'SUCCESS' }
  | { stage: 'ERROR'; error: string }

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

export type ModalState = Nullable<
  | { stage: 'CLAIM'; flowState: ClaimState }
  | { stage: 'RECEIVE'; flowState: ReceiveState }
  | { stage: 'SEND'; flowState: SendingState }
  | { stage: 'DISCORD_CODE' }
>

type TokenDashboardState = {
  modalState: Nullable<ModalState>
  modalVisible: boolean
  discordCode: Nullable<string>
}

const initialState: TokenDashboardState = {
  modalState: null,
  modalVisible: false,
  discordCode: null
}

const slice = createSlice({
  name: 'token-dashboard',
  initialState,
  reducers: {
    setModalState: (
      state,
      {
        payload: { modalState }
      }: PayloadAction<{ modalState: Nullable<ModalState> }>
    ) => {
      state.modalState = modalState
    },
    setModalVisibility: (
      state,
      { payload: { isVisible } }: PayloadAction<{ isVisible: boolean }>
    ) => {
      state.modalVisible = isVisible
    },
    inputSendData: (
      state,
      {
        payload: { amount, wallet }
      }: PayloadAction<{ amount: StringWei; wallet: WalletAddress }>
    ) => {
      const newState: ModalState = {
        stage: 'SEND' as 'SEND',
        flowState: {
          stage: 'AWAITING_CONFIRMATION',
          amount,
          recipientWallet: wallet
        }
      }
      state.modalState = newState
    },
    confirmSend: state => {
      if (
        state.modalState?.stage !== 'SEND' ||
        state.modalState.flowState.stage !== 'AWAITING_CONFIRMATION'
      )
        return

      state.modalState.flowState = {
        stage: 'SENDING',
        recipientWallet: state.modalState.flowState.recipientWallet,
        amount: state.modalState.flowState.amount
      }
    },
    pressReceive: state => {
      state.modalState = {
        stage: 'RECEIVE',
        flowState: { stage: 'KEY_DISPLAY' }
      }
      state.modalVisible = true
    },
    pressDiscord: state => {
      state.modalState = { stage: 'DISCORD_CODE' }
      state.modalVisible = true
    },
    setDiscordCode: (
      state,
      { payload: { code } }: PayloadAction<{ code: Nullable<string> }>
    ) => {
      state.discordCode = code
    },

    // Saga Actions

    pressClaim: () => {},
    pressSend: () => {}
  }
})

// Selectors

export const getSendData = (
  state: AppState
): Nullable<{ recipientWallet: string; amount: BNWei }> => {
  const modalState = state.application.pages.tokenDashboard.modalState
  if (
    !(
      modalState?.stage === 'SEND' &&
      (modalState.flowState.stage === 'CONFIRMED_SEND' ||
        modalState.flowState.stage === 'SENDING' ||
        modalState.flowState.stage === 'AWAITING_CONFIRMATION')
    )
  )
    return null
  const { recipientWallet, amount } = modalState.flowState
  return { recipientWallet, amount: stringWeiToBN(amount) }
}

export const getModalState = (state: AppState) =>
  state.application.pages.tokenDashboard.modalState
export const getModalVisible = (state: AppState) =>
  state.application.pages.tokenDashboard.modalVisible
export const getDiscordCode = (state: AppState) =>
  state.application.pages.tokenDashboard.discordCode ?? ''

export const {
  setModalState,
  setModalVisibility,
  pressClaim,
  pressReceive,
  pressSend,
  inputSendData,
  confirmSend,
  pressDiscord,
  setDiscordCode
} = slice.actions

export default slice.reducer
