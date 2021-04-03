import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppState } from 'store/types'
import {
  BNWei,
  StringWei,
  stringWeiToBN,
  WalletAddress
} from 'store/wallet/slice'
import { Nullable } from 'utils/typeUtils'

export type ConnectWalletsState =
  | { stage: 'ADD_WALLET' }
  | { stage: 'REMOVE_WALLET' }

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
  | { stage: 'CONNECT_WALLETS'; flowState: ConnectWalletsState }
  | { stage: 'RECEIVE'; flowState: ReceiveState }
  | { stage: 'SEND'; flowState: SendingState }
  | { stage: 'DISCORD_CODE' }
>

export type AssociatedWallets = string[]

export type ConfirmRemoveWalletAction = PayloadAction<{ wallet: WalletAddress }>

export type AssociatedWalletsState = {
  status: Nullable<'Connecting' | 'Confirming'>
  connectedWallets: Nullable<AssociatedWallets>
  confirmingWallet: Nullable<WalletAddress>
  errorMessage: Nullable<string>
  removeWallet: {
    wallet: Nullable<string>
    status: Nullable<'Confirming'>
  }
}

type TokenDashboardState = {
  modalState: Nullable<ModalState>
  modalVisible: boolean
  discordCode: Nullable<string>
  associatedWallets: AssociatedWalletsState
}

const initialState: TokenDashboardState = {
  modalState: null,
  modalVisible: false,
  discordCode: null,
  associatedWallets: {
    status: null,
    confirmingWallet: null,
    connectedWallets: null,
    errorMessage: null,
    removeWallet: {
      wallet: null,
      status: null
    }
  }
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

    pressSend: () => {},
    fetchAssociatedWallets: () => {},
    setAssociatedWallets: (
      state,
      {
        payload: { associatedWallets }
      }: PayloadAction<{ associatedWallets: AssociatedWallets }>
    ) => {
      state.associatedWallets.connectedWallets = associatedWallets
      state.associatedWallets.confirmingWallet = null
      state.associatedWallets.status = null
    },
    pressConnectWallets: state => {
      state.modalState = {
        stage: 'CONNECT_WALLETS',
        flowState: { stage: 'ADD_WALLET' }
      }
      state.modalVisible = true
      state.associatedWallets.removeWallet.wallet = null
      state.associatedWallets.errorMessage = null
    },
    connectNewWallet: state => {
      state.associatedWallets.status = 'Connecting'
      state.associatedWallets.errorMessage = null
    },
    setIsConnectingWallet: (
      state,
      { payload: { wallet } }: PayloadAction<{ wallet: string }>
    ) => {
      // is connecting
      state.associatedWallets.confirmingWallet = wallet
    },
    setWalletAddedConfirmed: (
      state,
      { payload: { wallet } }: PayloadAction<{ wallet: string }>
    ) => {
      state.associatedWallets.connectedWallets = (
        state.associatedWallets.connectedWallets || []
      ).concat(wallet)
    },
    requestRemoveWallet: (
      state,
      { payload: { wallet } }: PayloadAction<{ wallet: WalletAddress }>
    ) => {
      state.associatedWallets.removeWallet.wallet = wallet
      state.modalState = {
        stage: 'CONNECT_WALLETS',
        flowState: { stage: 'REMOVE_WALLET' }
      }
      state.associatedWallets.errorMessage = null
    },
    confirmRemoveWallet: (
      state,
      { payload: { wallet } }: ConfirmRemoveWalletAction
    ) => {
      state.associatedWallets.removeWallet.status = 'Confirming'
      state.modalState = {
        stage: 'CONNECT_WALLETS',
        flowState: { stage: 'ADD_WALLET' }
      }
    },
    removeWallet: (
      state,
      { payload: { wallet } }: PayloadAction<{ wallet: WalletAddress }>
    ) => {
      state.associatedWallets.removeWallet.status = null
      state.associatedWallets.removeWallet.wallet = null
      state.associatedWallets.connectedWallets =
        state.associatedWallets.connectedWallets?.filter(
          addr => addr !== wallet
        ) ?? null
    },
    updateWalletError: (
      state,
      { payload: { errorMessage } }: PayloadAction<{ errorMessage: string }>
    ) => {
      state.associatedWallets.errorMessage = errorMessage
      state.associatedWallets.removeWallet.status = null
      state.associatedWallets.removeWallet.wallet = null
      state.associatedWallets.confirmingWallet = null
      state.associatedWallets.status = null
    },
    preloadWalletProviders: state => {}
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
export const getAssociatedWallets = (state: AppState) =>
  state.application.pages.tokenDashboard.associatedWallets
export const getRemoveWallet = (state: AppState) =>
  state.application.pages.tokenDashboard.associatedWallets.removeWallet

export const {
  setModalState,
  setModalVisibility,
  pressReceive,
  pressSend,
  inputSendData,
  confirmSend,
  pressDiscord,
  setDiscordCode,
  fetchAssociatedWallets,
  setAssociatedWallets,
  connectNewWallet,
  pressConnectWallets,
  setIsConnectingWallet,
  requestRemoveWallet,
  confirmRemoveWallet,
  removeWallet,
  updateWalletError,
  preloadWalletProviders
} = slice.actions

export default slice.reducer
