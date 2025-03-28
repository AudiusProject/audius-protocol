import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Nullable } from '~/utils/typeUtils'

import {
  CanReceiveWAudio,
  InputSendDataAction,
  TokenDashboardPageModalState,
  TokenDashboardState
} from './types'

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
      }: PayloadAction<{ modalState: Nullable<TokenDashboardPageModalState> }>
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
      { payload: { amount, wallet } }: InputSendDataAction
    ) => {
      const newState: TokenDashboardPageModalState = {
        stage: 'SEND' as const,
        flowState: {
          stage: 'AWAITING_CONFIRMATION',
          amount,
          recipientWallet: wallet,
          canRecipientReceiveWAudio: 'loading'
        }
      }
      state.modalState = newState
    },
    setCanRecipientReceiveWAudio: (
      state,
      {
        payload: { canRecipientReceiveWAudio }
      }: PayloadAction<{ canRecipientReceiveWAudio: CanReceiveWAudio }>
    ) => {
      if (
        state.modalState?.stage === 'SEND' &&
        state.modalState.flowState.stage === 'AWAITING_CONFIRMATION'
      ) {
        state.modalState.flowState.canRecipientReceiveWAudio =
          canRecipientReceiveWAudio
      } else {
        console.error(
          'Tried to set canRecipientReceiveWAudio outside of correct flow state.'
        )
      }
    },
    transferEthAudioToSolWAudio: (state) => {
      if (
        state.modalState?.stage !== 'SEND' ||
        state.modalState.flowState.stage !== 'SENDING'
      )
        return

      state.modalState.flowState = {
        stage: 'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL',
        recipientWallet: state.modalState.flowState.recipientWallet,
        amount: state.modalState.flowState.amount
      }
    },
    confirmSend: (state) => {
      if (
        state.modalState?.stage !== 'SEND' ||
        (state.modalState.flowState.stage !== 'AWAITING_CONFIRMATION' &&
          state.modalState.flowState.stage !==
            'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL')
      )
        return

      state.modalState.flowState = {
        stage: 'SENDING',
        recipientWallet: state.modalState.flowState.recipientWallet,
        amount: state.modalState.flowState.amount
      }
    },
    pressReceive: (state) => {
      state.modalState = {
        stage: 'RECEIVE',
        flowState: { stage: 'KEY_DISPLAY' }
      }
      state.modalVisible = true
    },

    // Saga Actions

    pressSend: () => {}
  }
})

export const {
  setModalState,
  setModalVisibility,
  pressReceive,
  pressSend,
  inputSendData,
  confirmSend,
  transferEthAudioToSolWAudio,
  setCanRecipientReceiveWAudio
} = slice.actions
export const actions = slice.actions
export default slice
